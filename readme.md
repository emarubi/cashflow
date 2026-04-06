# Cashflow

Application web de gestion des relances de factures impayées — clone fonctionnel d'Upflow.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Node.js, Express, TypeScript |
| API | Apollo Server (GraphQL) |
| Base de données | PostgreSQL |
| Cache & Queues | Redis, BullMQ |
| Frontend | React, TypeScript, Apollo Client |
| Styling | Tailwind CSS |
| État global | React Context |
| i18n | react-i18next (FR + EN) |
| Tests | Jest, Supertest, React Testing Library |
| Infra locale | Docker Compose |

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) et Docker Compose
- [npm](https://www.npmjs.com/) >= 10

---

## Installation

```bash
# Cloner le repo
git clone https://github.com/ton-user/cashflow.git
cd cashflow

# Installer les dépendances (tous les packages)
npm install

# Copier les variables d'environnement
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

---

## Démarrage

### 1. Démarrer l'infrastructure (Postgres + Redis)

```bash
docker-compose up -d
```

Vérifie que les services sont up :
```bash
docker-compose ps
```

### 2. Initialiser la base de données

```bash
cd packages/backend

# Appliquer les migrations
npm run migrate

# Peupler avec les données de test
npm run seed
```

### 3. Démarrer le backend

```bash
# Depuis packages/backend
npm run dev
```

L'API GraphQL est disponible sur : http://localhost:4000/graphql
Le playground GraphQL est disponible sur : http://localhost:4000/graphql (en développement)

### 4. Démarrer le frontend

```bash
# Depuis packages/frontend
npm run dev
```

L'application est disponible sur : http://localhost:5173

---

## Comptes de démonstration

Trois compagnies sont disponibles après le seed :

### Open Demo Inc.
| Champ | Valeur |
|---|---|
| URL | http://localhost:5173/open-demo |
| Email | john.doe@open-demo.com |
| Mot de passe | demo1234 |

### Acme Finance
| Champ | Valeur |
|---|---|
| URL | http://localhost:5173/acme-finance |
| Email | jane.smith@acme-finance.com |
| Mot de passe | demo1234 |

### Nord Supply
| Champ | Valeur |
|---|---|
| URL | http://localhost:5173/nord-supply |
| Email | marc.dupont@nord-supply.com |
| Mot de passe | demo1234 |

---

## Structure du projet

```
cashflow/
├── packages/
│   ├── backend/                  # API Node.js + GraphQL
│   │   ├── src/
│   │   │   ├── auth/             # JWT, middleware
│   │   │   ├── graphql/          # schema, resolvers, dataloaders
│   │   │   ├── db/               # migrations, seeds, pool
│   │   │   ├── queues/           # BullMQ workers et scheduler
│   │   │   ├── cache/            # Redis helpers
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── unit/
│   │       └── integration/
│   │
│   └── frontend/                 # App React
│       ├── src/
│       │   ├── components/       # composants réutilisables
│       │   ├── pages/            # Dashboard, Workflows, Clients...
│       │   ├── contexts/         # AuthContext, UIContext
│       │   ├── graphql/          # queries et mutations
│       │   ├── hooks/            # custom hooks
│       │   └── locales/          # fr.json, en.json
│       └── tests/
│
├── docker-compose.yml
├── PRD.md                        # Product Requirements Document
├── CLAUDE.md                     # Guide pour Claude Code
└── README.md
```

---

## Pages de l'application

| Route | Description |
|---|---|
| `/:slug` | Page de login de la compagnie |
| `/:slug/dashboard` | KPIs, DSO, taux de risque, aging balance |
| `/:slug/workflows` | Liste et configuration des workflows |
| `/:slug/workflows/:id` | Détail d'un workflow avec ses actions |
| `/:slug/customers` | Liste des clients débiteurs |
| `/:slug/customers/:id` | Détail d'un client |
| `/:slug/invoices` | Liste des factures avec filtres |
| `/:slug/actions` | Actions à traiter (To Do) |
| `/:slug/emails` | Historique des emails envoyés |
| `/:slug/payments` | Liste des paiements |
| `/:slug/bank` | Transactions bancaires et rapprochement |

---

## Tests

```bash
# Tous les tests (depuis la racine)
npm test

# Backend uniquement
cd packages/backend
npm run test:unit          # tests unitaires
npm run test:integration   # tests d'intégration

# Frontend uniquement
cd packages/frontend
npm test
```

---

## Architecture des queues

Le système de relances automatiques fonctionne ainsi :

1. **Scheduler** (toutes les 60s) : récupère les `executions` dont `next_run_at <= NOW()` et les enqueue dans BullMQ avec un jitter aléatoire de 0 à 5 minutes
2. **Worker** : traite chaque job en vérifiant l'idempotency, la status de la facture, puis simule l'envoi (log console + insert `action_events`)
3. **Dead-letter queue** : les jobs échoués après 5 tentatives sont loggés et l'execution est marquée `failed`

> En développement, les envois d'emails sont simulés. Les logs apparaissent dans la console du backend avec le préfixe `[DUNNING]`.

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

## Docker Compose

Les services disponibles :

| Service | Port | Description |
|---|---|---|
| `postgres` | 5432 | Base de données PostgreSQL |
| `redis` | 6379 | Cache et queues BullMQ |

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Réinitialiser les données
docker-compose down -v && docker-compose up -d
npm run migrate && npm run seed
```

---

## Conventions de développement

- **TypeScript strict** activé sur tous les packages
- **Isolation tenant** : toutes les queries SQL filtrent sur `company_id` extrait du JWT
- **Pas de prop drilling** : données serveur via Apollo Cache, état global via React Context
- **Migrations** : ne jamais modifier une migration existante, toujours en créer une nouvelle
- **Tests** : un fichier de test par fichier source

---

## Licence

MIT
