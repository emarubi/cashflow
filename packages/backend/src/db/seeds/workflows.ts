import { PoolClient } from 'pg'
import { uuid } from './helpers'
import { CompanyRecord } from './companies'
import { TemplateRecord } from './email-templates'

export interface ActionRecord {
  id: string
  workflowId: string
  stepOrder: number
  channel: string
}

export interface WorkflowRecord {
  id: string
  companyId: string
  name: string
  actions: ActionRecord[]
}

type ActionDef = {
  delayDays: number
  trigger: string
  channel: string
  templateName: string | null
  senderName: string
  stepOrder: number
}

type WorkflowDef = {
  name: string
  minContactDelayDays: number
  firstActionLogic: string
  replyTo: string
  actions: ActionDef[]
}

const WORKFLOW_DEFS: Record<string, WorkflowDef[]> = {
  'open-demo': [
    {
      name: 'Standard SaaS',
      minContactDelayDays: 5,
      firstActionLogic: 'standard',
      replyTo: 'billing@open-demo.com',
      actions: [
        { stepOrder: 1, delayDays: 7,  trigger: 'after_due', channel: 'email', templateName: 'Friendly Reminder', senderName: 'Open Demo Billing' },
        { stepOrder: 2, delayDays: 14, trigger: 'after_due', channel: 'email', templateName: 'Second Notice',     senderName: 'Open Demo Billing' },
        { stepOrder: 3, delayDays: 30, trigger: 'after_due', channel: 'email', templateName: 'Final Notice',      senderName: 'Open Demo Billing' },
      ],
    },
    {
      name: 'Enterprise Recovery',
      minContactDelayDays: 7,
      firstActionLogic: 'contextualized',
      replyTo: 'enterprise@open-demo.com',
      actions: [
        { stepOrder: 1, delayDays: 3,  trigger: 'after_due', channel: 'email', templateName: 'Friendly Reminder', senderName: 'Alice Martin' },
        { stepOrder: 2, delayDays: 10, trigger: 'after_due', channel: 'call',  templateName: null,                senderName: 'Alice Martin' },
        { stepOrder: 3, delayDays: 20, trigger: 'after_due', channel: 'email', templateName: 'Second Notice',     senderName: 'Alice Martin' },
        { stepOrder: 4, delayDays: 45, trigger: 'after_due', channel: 'email', templateName: 'Final Notice',      senderName: 'Alice Martin' },
      ],
    },
    {
      name: 'Self-serve',
      minContactDelayDays: 3,
      firstActionLogic: 'standard',
      replyTo: 'billing@open-demo.com',
      actions: [
        { stepOrder: 1, delayDays: 5,  trigger: 'after_due', channel: 'email', templateName: 'Friendly Reminder', senderName: 'Open Demo Billing' },
        { stepOrder: 2, delayDays: 15, trigger: 'after_due', channel: 'email', templateName: 'Second Notice',     senderName: 'Open Demo Billing' },
      ],
    },
  ],
  'acme-finance': [
    {
      name: 'Standard Recovery',
      minContactDelayDays: 5,
      firstActionLogic: 'standard',
      replyTo: 'ar@acme-finance.com',
      actions: [
        { stepOrder: 1, delayDays: 5,  trigger: 'after_due', channel: 'email', templateName: 'Formal Payment Notice', senderName: 'Acme Finance AR' },
        { stepOrder: 2, delayDays: 15, trigger: 'after_due', channel: 'email', templateName: 'Pre-Legal Warning',     senderName: 'Acme Finance AR' },
        { stepOrder: 3, delayDays: 30, trigger: 'after_due', channel: 'email', templateName: 'Legal Notice',          senderName: 'Acme Finance Legal' },
      ],
    },
    {
      name: 'Legal Track',
      minContactDelayDays: 7,
      firstActionLogic: 'standard',
      replyTo: 'legal@acme-finance.com',
      actions: [
        { stepOrder: 1, delayDays: 7,  trigger: 'after_due', channel: 'email',  templateName: 'Formal Payment Notice', senderName: 'Acme Finance AR' },
        { stepOrder: 2, delayDays: 21, trigger: 'after_due', channel: 'letter', templateName: 'Pre-Legal Warning',     senderName: 'Acme Finance AR' },
        { stepOrder: 3, delayDays: 35, trigger: 'after_due', channel: 'call',   templateName: null,                   senderName: 'Paul Rivers' },
        { stepOrder: 4, delayDays: 60, trigger: 'after_due', channel: 'letter', templateName: 'Legal Notice',          senderName: 'Acme Finance Legal' },
      ],
    },
  ],
  'nord-supply': [
    {
      name: 'Standard B2B',
      minContactDelayDays: 5,
      firstActionLogic: 'standard',
      replyTo: 'ar@nord-supply.com',
      actions: [
        { stepOrder: 1, delayDays: 7,  trigger: 'after_due', channel: 'email', templateName: 'Payment Reminder',      senderName: 'Nord Supply AR' },
        { stepOrder: 2, delayDays: 14, trigger: 'after_due', channel: 'call',  templateName: null,                    senderName: 'Sarah Kelly' },
        { stepOrder: 3, delayDays: 30, trigger: 'after_due', channel: 'email', templateName: 'Urgent Payment Request', senderName: 'Nord Supply AR' },
      ],
    },
    {
      name: 'Key Accounts',
      minContactDelayDays: 10,
      firstActionLogic: 'contextualized',
      replyTo: 'keyaccounts@nord-supply.com',
      actions: [
        { stepOrder: 1, delayDays: 10, trigger: 'after_due', channel: 'email',  templateName: 'Payment Reminder', senderName: 'Marc Dupont' },
        { stepOrder: 2, delayDays: 20, trigger: 'after_due', channel: 'call',   templateName: null,               senderName: 'Marc Dupont' },
        { stepOrder: 3, delayDays: 45, trigger: 'after_due', channel: 'letter', templateName: 'Final Demand',     senderName: 'Marc Dupont' },
      ],
    },
  ],
}

export async function seedWorkflows(
  client: PoolClient,
  companies: CompanyRecord[],
  templates: TemplateRecord[],
): Promise<WorkflowRecord[]> {
  const all: WorkflowRecord[] = []

  // Build template lookup by (companyId, name)
  const templateByKey = new Map<string, string>()
  for (const t of templates) {
    templateByKey.set(`${t.companyId}:${t.name}`, t.id)
  }

  for (const company of companies) {
    const defs = WORKFLOW_DEFS[company.slug] ?? []
    for (const def of defs) {
      const workflowId = uuid()
      await client.query(
        `INSERT INTO workflows (id, company_id, name, min_contact_delay_days, first_action_logic, reply_to)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [workflowId, company.id, def.name, def.minContactDelayDays, def.firstActionLogic, def.replyTo],
      )

      const actionRecords: ActionRecord[] = []
      for (const a of def.actions) {
        const actionId = uuid()
        const templateId = a.templateName
          ? (templateByKey.get(`${company.id}:${a.templateName}`) ?? null)
          : null
        await client.query(
          `INSERT INTO actions (id, workflow_id, delay_days, trigger, channel, template_id, sender_name, step_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [actionId, workflowId, a.delayDays, a.trigger, a.channel, templateId, a.senderName, a.stepOrder],
        )
        actionRecords.push({ id: actionId, workflowId, stepOrder: a.stepOrder, channel: a.channel })
      }

      all.push({ id: workflowId, companyId: company.id, name: def.name, actions: actionRecords })
    }
  }

  console.log(`  ✓ workflows: ${all.length}, actions: ${all.reduce((s, w) => s + w.actions.length, 0)}`)
  return all
}
