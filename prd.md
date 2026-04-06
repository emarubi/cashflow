# PRD — Cashflow

## 1. Vue d'ensemble

**Cashflow** est une application web multi-tenant de gestion des relances de factures impayées. Elle permet aux équipes financières de piloter leur recouvrement via des workflows automatisés, de suivre les paiements et les transactions bancaires, et d'analyser leur performance en temps réel.

Ce projet est un clone fonctionnel d'Upflow, construit avec la stack suivante :
- **Backend :** Node.js, Express, TypeScript, Apollo Server (GraphQL), PostgreSQL, Redis, BullMQ
- **Frontend :** React, TypeScript, Apollo Client, React Context, Tailwind CSS
- **Infra locale :** Docker Compose

---

## 2. Objectifs

- Reproduire fidèlement les fonctionnalités principales visibles dans la démo Upflow
- Implémenter une architecture multi-tenant réaliste avec isolation des données par compagnie
- Démontrer la maîtrise de la stack technique complète (fullstack TypeScript, GraphQL, queues, auth)
- Servir de support de préparation à un entretien technique Senior Fullstack Engineer

---

## 3. Utilisateurs cibles

| Rôle | Description |
|---|---|
| **Admin compagnie** | Configure les workflows, gère les utilisateurs |
| **Utilisateur finance** | Traite les relances, consulte le dashboard, suit les paiements |

Chaque compagnie est un tenant isolé. Un utilisateur appartient à une seule compagnie.

---

## 4. Fonctionnalités

### 4.1 Authentification
- Login par compagnie (slug ou domaine) + email + mot de passe
- Token JWT avec refresh token
- Sessions isolées par tenant
- Déconnexion

### 4.2 Dashboard
- KPIs : montant total impayé, montant dû, montant en retard, montant non appliqué
- DSO (Days Sales Outstanding) avec évolution mensuelle (graphique barres)
- Taux de risque avec évolution mensuelle (graphique barres)
- Nombre d'actions à faire
- Top débiteurs par montant impayé
- Aging balance (répartition des impayés par ancienneté)
- Clients avec moyen de paiement enregistré

### 4.3 Workflows
- Liste des workflows avec métriques (clients assignés, actions effectuées, taux ouverture email, montant en cours, DSO)
- Création / édition d'un workflow
- Configuration : délai minimum entre contacts, adresse de réponse, logique première action
- Séquence d'actions : canal (email / appel / lettre), délai (avant/après échéance), template, expéditeur
- Assignation d'un workflow à un client

### 4.4 Clients (Debtors)
- Liste paginée avec filtres et recherche
- Colonnes : nom, note de risque (A/B/C/D), utilisateur assigné, workflow, montant impayé, moyen de paiement
- Vue détail client : historique des actions, factures, notes

### 4.5 Factures
- Liste paginée avec filtres (statut : due, overdue, in dispute) et recherche
- Colonnes : numéro, client, statut, date d'émission, date d'échéance, montant impayé, montant total
- Onglets : Factures / Notes de crédit
- Indicateur factures non envoyées

### 4.6 Actions (To Do)
- Vue "To Do" et vue "All"
- Liste des relances en attente avec filtres (reminders, replies, billings)
- Détail d'une action : email pré-rempli avec template, expéditeur, destinataire
- Actions possibles : Envoyer / Mettre en pause / Ignorer
- Fonction IA : résumé du contexte client (simulé)

### 4.7 Emails
- Historique des emails envoyés par client et par facture
- Statut : envoyé, ouvert, en erreur

### 4.8 Paiements
- Liste paginée des paiements avec filtres
- Colonnes : référence, date, source, statut, type, méthode, client, facture associée, montant

### 4.9 Transactions bancaires
- Liste des transactions avec statut (applied / unapplied)
- Suggestions automatiques de rapprochement avec les factures
- Action : appliquer manuellement une transaction à une facture

---

## 5. Modèle de données (PostgreSQL)

### Tables principales

```sql
companies         -- tenants
users             -- utilisateurs par compagnie
debtors           -- clients débiteurs
invoices          -- factures (status: draft/due/overdue/paid/in_dispute)
workflows         -- templates de workflow par compagnie
actions           -- étapes d'un workflow (channel, delay, template)
executions        -- état d'exécution d'un workflow pour une facture
action_events     -- historique immuable des actions effectuées
payments          -- paiements reçus
bank_transactions -- transactions bancaires importées
email_templates   -- templates d'emails par compagnie
```

### Index notables
```sql
-- Partial index sur les factures impayées (performance critique)
CREATE INDEX idx_invoices_unpaid
ON invoices (due_date, company_id)
WHERE status IN ('due', 'overdue');

-- Index sur next_run_at pour le scheduler
CREATE INDEX idx_executions_next_run
ON executions (next_run_at)
WHERE status = 'active';
```

---

## 6. Architecture backend

### GraphQL
- Apollo Server avec Express
- Schéma typé (SDL first)
- Resolvers avec DataLoader pour éviter le N+1
- Authentification via middleware (context JWT)
- Queries : invoices, debtors, workflows, payments, bankTransactions, dashboard
- Mutations : sendAction, pauseExecution, createWorkflow, updateWorkflow, applyBankTransaction

### Queue (BullMQ + Redis)
- Queue `dunning` : traitement des relances programmées
- Worker : vérifie idempotency → simule envoi email → log console + insert `action_events`
- Scheduler : poll toutes les minutes sur `executions.next_run_at`
- Dead-letter queue : alertes sur échecs répétés

### Cache (Redis)
- Cache des queries GraphQL fréquentes (dashboard KPIs, TTL 5 min)
- Sessions JWT (refresh tokens)
- Idempotency keys des jobs BullMQ

### Auth
- JWT access token (15 min) + refresh token (7 jours) stocké Redis
- Middleware Express qui injecte `{ companyId, userId }` dans le context GraphQL
- Isolation tenant : toutes les queries filtrent sur `company_id`

---

## 7. Architecture frontend

### Structure des pages
```
/login                    → LoginPage
/:companySlug/dashboard   → DashboardPage
/:companySlug/workflows   → WorkflowsPage
/:companySlug/workflows/:id → WorkflowDetailPage
/:companySlug/customers   → CustomersPage
/:companySlug/customers/:id → CustomerDetailPage
/:companySlug/invoices    → InvoicesPage
/:companySlug/actions     → ActionsPage
/:companySlug/emails      → EmailsPage
/:companySlug/payments    → PaymentsPage
/:companySlug/bank        → BankTransactionsPage
```

### State management
- **Apollo Cache** : toutes les données serveur
- **AuthContext** : `{ company, user, token, login, logout }`
- **UIContext** : `{ language, setLanguage, sidebarOpen, setSidebarOpen }`
- **useState / useReducer** : état local des composants

### i18n
- Librairie : `react-i18next`
- Langues : français (défaut) + anglais
- Fichiers : `locales/fr.json` et `locales/en.json`

---

## 8. Données de test (Seeds)

3 compagnies avec données réalistes distinctes :

| Compagnie | Slug | Secteur | Volume |
|---|---|---|---|
| Open Demo Inc. | `open-demo` | SaaS B2B | ~500 clients, ~850 factures |
| Acme Finance | `acme-finance` | Services financiers | ~200 clients, ~400 factures |
| Nord Supply | `nord-supply` | Distribution | ~150 clients, ~300 factures |

Chaque compagnie a : utilisateurs, workflows configurés, factures à divers statuts, historique d'actions, paiements, transactions bancaires.

---

## 9. Tests

### Backend
- **Jest** : unitaires sur les resolvers GraphQL, les workers BullMQ, les utilitaires
- **Supertest** : intégration sur les endpoints Express (auth, GraphQL)
- Coverage cible : 70%

### Frontend
- **Jest + React Testing Library** : composants, hooks, contexts
- Tests de rendu et d'interaction (filtres, pagination, formulaires)
- Coverage cible : 60%

---

## 10. Hors scope

- Vrai envoi d'emails (simulé par log)
- Déploiement GCP / Terraform
- Intégrations externes (CRM, banques, providers de paiement)
- Fonctionnalités IA réelles (résumé simulé)
- Mobile / responsive complet
