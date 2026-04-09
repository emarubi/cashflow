# Cashflow — Dunning Execution Process

This document describes how the automated dunning system works end-to-end: from an invoice becoming overdue to the final action being sent (or the execution completing/failing).

---

## Overview

When an invoice is assigned to a workflow, an **execution** row is created. The execution tracks exactly where that invoice is in its dunning sequence. A background scheduler polls the database every 60 seconds, enqueues ready executions into a BullMQ queue, and a worker processes each job — sending the action, then advancing the execution to the next step.

```
Invoice overdue
      │
      ▼
executions row created (status=active, next_run_at=due_date + delay_days)
      │
      ▼
Scheduler (every 60s) ──► finds next_run_at <= NOW()
      │
      ▼
BullMQ dunning-queue ──► Worker picks up job
      │
      ▼
Worker: idempotency → lock invoice → send → advance → next_run_at
      │
      ├── more actions? ──► update next_run_at → loop
      │
      └── no more actions? ──► status = completed
```

---

## Key Tables

| Table | Role |
|-------|------|
| `executions` | One row per invoice. Tracks current step, status, and when to run next. |
| `actions` | The steps of a workflow (delay, trigger type, channel, template). |
| `action_events` | Audit log — one row per action sent (result: sent / failed / skipped / cancelled_paid). |
| `invoices` | Source of truth for paid status. Locked `FOR UPDATE` during processing. |
| `workflows` | Parent of the action sequence. |

---

## Scheduler

**File:** `packages/backend/src/queues/dunning.scheduler.ts`

- Runs `enqueueReadyExecutions()` immediately on startup, then every **60 seconds** via `setInterval`.
- The 60-second interval is intentional: dunning actions are spaced days or weeks apart, so sub-minute precision is irrelevant. It avoids hammering the database with a tight loop.

**Query:**

```sql
SELECT e.id, e.current_action_id, e.invoice_id, i.company_id
FROM executions e
JOIN invoices i ON i.id = e.invoice_id
WHERE e.status = 'active'
  AND e.next_run_at <= NOW()
  AND e.current_action_id IS NOT NULL
```

**Jitter:** Each job is enqueued with a random delay of **0–5 minutes** to spread load when many invoices are due simultaneously.

---

## BullMQ Worker

**File:** `packages/backend/src/queues/dunning.worker.ts`  
**Queue name:** `dunning-queue`  
**Concurrency:** 5 parallel jobs  
**Retries:** 3 attempts with exponential backoff (5 s initial delay)

### Processing steps

1. **Test job check** — If `job.data.test === true`, log `[DUNNING TEST]` and return immediately (used by "Send me a test email" in the UI).

2. **Redis idempotency check** — Key: `idempotency:{executionId}:{actionId}`. If already `"1"`, skip (prevents double-sends on retry).

3. **Begin DB transaction** — All remaining steps run inside a single transaction.

4. **Lock invoice** — `SELECT status FROM invoices WHERE id = $1 FOR UPDATE`. If not found, abort.

5. **Paid check** — If `invoice.status = 'paid'`:
   - Set `executions.status = 'paused'`, `next_run_at = NULL`
   - Commit and return.

6. **Send action** — Log `[DUNNING] Sending action {actionId} for invoice {invoiceId}`. In production this is where the email/call/letter dispatch happens.

7. **Insert action_event** — Record `result = 'sent'` with job metadata.

8. **Advance execution** — Find the next action by `step_order + 1`:
   - **Next action exists:** `UPDATE executions SET current_action_id = next.id, next_run_at = NOW() + delay_days + jitter`
   - **No next action:** `UPDATE executions SET status = 'completed', current_action_id = NULL, next_run_at = NULL`

9. **Commit** — Then write idempotency key to Redis (TTL 24 h).

10. **Invalidate dashboard cache** — Redis key `dashboard:{companyId}` cleared so KPIs reflect the new state.

---

## `next_run_at` Lifecycle

`next_run_at` is the timestamp the scheduler uses to decide when to fire the next action for a given execution.

| Event | `next_run_at` value |
|-------|---------------------|
| Execution created | `invoice.due_date + first_action.delay_days` |
| Worker advances to next step | `NOW() + next_action.delay_days + jitter (0–5 min)` |
| No more actions (completed) | `NULL` |
| Invoice paid mid-sequence | `NULL` (status → `paused`) |
| Manually paused | `NULL` |
| Manually resumed | `NOW()` (fires at next scheduler tick, ~0–60 s) |
| Permanent failure | `NULL` (status → `failed`) |

---

## Execution Status State Machine

```
         created
            │
            ▼
         active  ◄──── resumed
            │
     ┌──────┼──────────┐
     │      │          │
     ▼      ▼          ▼
  paused  failed   completed
  (paid / (3 retries  (no more
  manual)  exhausted)  actions)
     │
     └──► active (manual resume)
```

| Status | Meaning |
|--------|---------|
| `active` | Execution is running; scheduler will pick it up when `next_run_at <= NOW()` |
| `paused` | Stopped (invoice paid, or manually paused); ignored by scheduler |
| `completed` | All actions sent; execution is done |
| `failed` | Worker exhausted all retries; requires manual investigation |

---

## Dead-Letter Queue

**File:** `packages/backend/src/queues/dunning.dlq.ts`

When a job fails permanently (all 3 retries exhausted), the DLQ handler:
1. Marks `executions.status = 'failed'`, `next_run_at = NULL`
2. Invalidates the dashboard cache

The failed `action_events` row (inserted by the worker on each failed attempt) preserves the error message for debugging.

---

## Test Email Flow

Triggered from the "Send me a test email" button in the workflow action drawer.

1. Frontend calls `sendTestEmail(input: { to, subject, body })` mutation.
2. Backend enqueues a job with `{ test: true, testTo, testSubject, testBody }` into `dunning-queue`.
3. Worker detects `test === true` at step 1 and short-circuits: logs `[DUNNING TEST]` to console, returns immediately.
4. No `action_event` is written; no execution is advanced.
