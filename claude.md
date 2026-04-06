# CLAUDE.md — Cashflow

Ce fichier guide Claude Code dans la compréhension du projet, des conventions et des décisions d'architecture.

---

## Ressources de référence

Avant de générer du code, toujours consulter ces fichiers :

| Ressource | Chemin | Contenu |
|---|---|---|
| PRD | `PRD.md` | Fonctionnalités, modèle de données, architecture |
| Screenshots UI | `docs/screenshots/` | 10 captures de l'interface cible (Upflow) |
| Schéma SQL | `docs/schema.sql` | Schéma PostgreSQL complet avec index |

Les screenshots sont la référence visuelle absolue pour le frontend.
Chaque composant React doit correspondre fidèlement à ce qui est visible dans ces captures.

---

## Vue d'ensemble du projet

Cashflow est une application web fullstack multi-tenant de gestion des relances de factures impayées.

- **Monorepo** avec deux packages : `backend` et `frontend`
- **Backend :** Node.js + Express + TypeScript + Apollo Server + PostgreSQL + Redis + BullMQ
- **Frontend :** React + TypeScript + Apollo Client + React Context + Tailwind CSS
- **Infra locale :** Docker Compose

---

## Structure du monorepo

```
cashflow/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── auth/           # JWT, middleware, refresh tokens
│   │   │   ├── graphql/        # schema SDL, resolvers, dataloaders
│   │   │   ├── db/             # migrations, seeds, pool Postgres
│   │   │   ├── queues/         # BullMQ queues et workers
│   │   │   ├── cache/          # Redis client et helpers
│   │   │   └── index.ts        # point d'entrée Express
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/     # composants réutilisables
│       │   ├── pages/          # une page = un dossier
│       │   ├── contexts/       # AuthContext, UIContext
│       │   ├── graphql/        # queries, mutations, fragments
│       │   ├── hooks/          # custom hooks
│       │   ├── locales/        # fr.json, en.json
│       │   └── main.tsx
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml
├── PRD.md
├── README.md
└── CLAUDE.md
```

---

## Conventions de code

### Général
- **TypeScript strict** : `"strict": true` dans tous les tsconfig
- **Nommage** : camelCase pour les variables/fonctions, PascalCase pour les types/composants, SCREAMING_SNAKE_CASE pour les constantes
- **Imports** : absolus depuis `src/` (pas de `../../..`)
- **Pas de `any`** : utiliser `unknown` si le type est inconnu
- **Commentaires** : en anglais, uniquement pour expliquer le "pourquoi", jamais le "quoi"

### Backend
- Un fichier par resolver (ex: `invoices.resolver.ts`)
- Les resolvers ne contiennent pas de logique SQL — déléguer aux services
- Les services ne contiennent pas de logique HTTP/GraphQL
- Toujours filtrer par `company_id` dans les queries SQL — isolation tenant obligatoire
- Utiliser des transactions Postgres pour toute opération multi-tables
- Nommer les migrations : `YYYYMMDD_description.sql`

### Frontend
- Un dossier par page : `pages/Dashboard/index.tsx` + `pages/Dashboard/Dashboard.test.tsx`
- Les composants ne fetchent pas de données directement — utiliser des custom hooks
- Les custom hooks sont dans `hooks/` et préfixés par `use` (ex: `useInvoices.ts`)
- Les queries GraphQL sont dans `graphql/queries/` et les mutations dans `graphql/mutations/`
- Pas de props drilling au-delà de 2 niveaux — utiliser Apollo Cache ou Context

---

## Multi-tenancy — règle absolue

**Toute query SQL doit inclure `WHERE company_id = $companyId`.**

Le `companyId` est injecté dans le context GraphQL depuis le JWT :

```typescript
// context Apollo Server
const context = ({ req }) => {
  const token = req.headers.authorization?.split(' ')[1]
  const payload = verifyToken(token)
  return { companyId: payload.companyId, userId: payload.userId }
}

// Dans chaque resolver — TOUJOURS
const invoices = await db.query(
  'SELECT * FROM invoices WHERE company_id = $1',
  [context.companyId]
)
```

Ne jamais faire confiance aux paramètres de requête pour l'isolation tenant — toujours utiliser le context JWT.

---

## Schéma de base de données

Tables et relations clés :

```
companies         (id, name, slug, plan, created_at)
users             (id, company_id, email, password_hash, role, name)
debtors           (id, company_id, name, email, rating, assigned_user_id)
invoices          (id, company_id, debtor_id, number, amount, due_date, status, paid_at)
workflows         (id, company_id, name, min_contact_delay_days, is_active)
actions           (id, workflow_id, delay_days, trigger, channel, template_id, step_order)
executions        (id, invoice_id, workflow_id, current_action_id, status, next_run_at)
action_events     (id, execution_id, action_id, triggered_at, result, error)
payments          (id, company_id, debtor_id, invoice_id, amount, method, status, received_at)
bank_transactions (id, company_id, amount, description, payer, status, posted_at)
email_templates   (id, company_id, name, subject, body, channel)
```

Index critiques à toujours respecter :
- `invoices` : partial index sur `status IN ('due','overdue')`
- `executions` : partial index sur `next_run_at WHERE status = 'active'`

---

## Queue BullMQ

### Queue `dunning`
- Nommée `dunning-queue`
- Chaque job représente une action à exécuter pour une execution donnée
- Payload : `{ executionId, actionId, invoiceId, companyId }`

### Worker
Le worker suit ce flow exact :
1. Vérifier idempotency dans `action_events` (execution_id + action_id + result = 'sent')
2. Si déjà traité → skip + ack
3. Vérifier que la facture est toujours impayée (FOR UPDATE)
4. Si payée → mettre à jour execution.status = 'paused', next_run_at = null → ack
5. Logger en console : `[DUNNING] Sending action ${actionId} for invoice ${invoiceId}`
6. Insérer dans `action_events` avec result = 'sent'
7. Avancer execution au step suivant ou status = 'completed'

### Scheduler
- Tourne toutes les 60 secondes
- Query : `SELECT * FROM executions WHERE status = 'active' AND next_run_at <= NOW()`
- Enqueue chaque résultat dans `dunning-queue` avec jitter (0-5 min)

---

## Cache Redis

| Clé | Valeur | TTL |
|---|---|---|
| `dashboard:${companyId}` | KPIs sérialisés | 5 min |
| `refresh:${userId}` | refresh token | 7 jours |
| `idempotency:${executionId}:${actionId}` | `1` | 24h |

Invalider `dashboard:${companyId}` à chaque mutation qui affecte les KPIs.

---

## Auth JWT

- Access token : 15 min, signé avec `JWT_SECRET`
- Refresh token : 7 jours, stocké dans Redis (`refresh:${userId}`)
- Payload : `{ userId, companyId, companySlug, role, iat, exp }`
- Middleware Express vérifie le token sur toutes les routes sauf `POST /auth/login` et `POST /auth/refresh`

---

## GraphQL — conventions

- **SDL first** : le schéma est défini dans `src/graphql/schema.graphql`
- **DataLoader obligatoire** pour tout champ qui charge une relation (éviter N+1)
- **Pagination** : cursor-based pour les listes (pas offset) — `{ edges, pageInfo }`
- **Erreurs** : utiliser `GraphQLError` avec un code explicite (`UNAUTHORIZED`, `NOT_FOUND`, etc.)

---

## i18n

- Librairie : `react-i18next`
- Langue par défaut : français
- Clés de traduction : snake_case (`invoice.status.overdue`)
- Fichiers : `src/locales/fr.json` et `src/locales/en.json`
- Ne jamais mettre de texte en dur dans les composants — toujours passer par `t('clé')`

---

## Tests

### Backend
```bash
cd packages/backend
npm test              # tous les tests
npm run test:unit     # Jest unitaires
npm run test:integration  # Supertest
```

### Frontend
```bash
cd packages/frontend
npm test              # Jest + RTL
```

### Conventions
- Un fichier de test par fichier source : `invoices.resolver.test.ts`
- Mocks : utiliser `jest.mock()` pour Postgres et Redis dans les tests unitaires
- Les tests d'intégration utilisent une DB de test séparée (variable `TEST_DATABASE_URL`)

---

## Variables d'environnement

### Backend (`packages/backend/.env`)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://cashflow:cashflow@localhost:5432/cashflow
TEST_DATABASE_URL=postgresql://cashflow:cashflow@localhost:5432/cashflow_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_too
```

### Frontend (`packages/frontend/.env`)
```env
VITE_API_URL=http://localhost:4000/graphql
```

---

## Commandes utiles

```bash
# Démarrer l'infra locale
docker-compose up -d

# Backend
cd packages/backend
npm run dev          # ts-node-dev avec hot reload
npm run migrate      # appliquer les migrations
npm run seed         # peupler les données de test

# Frontend
cd packages/frontend
npm run dev          # Vite dev server

# Tous les tests
npm test             # depuis la racine (workspace)
```

---

## Ce que Claude Code ne doit PAS faire

- Ne jamais supprimer les migrations existantes — en créer de nouvelles
- Ne jamais exposer `company_id` comme paramètre de query GraphQL — toujours depuis le JWT
- Ne jamais bypasser le middleware d'auth pour "simplifier"
- Ne jamais mettre de logique métier dans les composants React — utiliser des hooks
- Ne jamais utiliser `SELECT *` en production — lister les colonnes explicitement
- Ne jamais commit de secrets dans le code — utiliser les variables d'environnement
