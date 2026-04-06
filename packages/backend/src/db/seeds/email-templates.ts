import { PoolClient } from 'pg'
import { uuid } from './helpers'
import { CompanyRecord } from './companies'

export interface TemplateRecord {
  id: string
  companyId: string
  name: string
}

type TemplateDef = { name: string; subject: string; body: string; channel: string }

const TEMPLATES: Record<string, TemplateDef[]> = {
  'open-demo': [
    {
      name: 'Friendly Reminder',
      subject: 'Friendly reminder: Invoice {{invoice_number}} is due',
      body: "Hi {{debtor_name}},\n\nJust a quick reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nPlease let us know if you have any questions.\n\nBest,\n{{sender_name}}",
      channel: 'email',
    },
    {
      name: 'Second Notice',
      subject: 'Action required: Invoice {{invoice_number}} is overdue',
      body: "Hi {{debtor_name}},\n\nWe noticed that invoice {{invoice_number}} for {{amount}} was due on {{due_date}} and remains unpaid.\n\nCould you let us know when we can expect payment?\n\nBest,\n{{sender_name}}",
      channel: 'email',
    },
    {
      name: 'Final Notice',
      subject: 'Final notice: Invoice {{invoice_number}} — immediate action required',
      body: "Hi {{debtor_name}},\n\nThis is a final notice for invoice {{invoice_number}} for {{amount}}, which is now {{days_overdue}} days overdue.\n\nPlease arrange payment immediately or contact us to discuss a payment plan.\n\nRegards,\n{{sender_name}}",
      channel: 'email',
    },
    {
      name: 'Dispute Acknowledgment',
      subject: 'Re: Invoice {{invoice_number}} — dispute acknowledgment',
      body: "Hi {{debtor_name}},\n\nThank you for reaching out regarding invoice {{invoice_number}}. We have noted your dispute and our team will review it within 5 business days.\n\nBest,\n{{sender_name}}",
      channel: 'email',
    },
  ],
  'acme-finance': [
    {
      name: 'Formal Payment Notice',
      subject: 'Payment Notice — Invoice {{invoice_number}}',
      body: "Dear {{debtor_name}},\n\nThis is a formal notice that invoice {{invoice_number}} for {{amount}}, dated {{issue_date}}, remains outstanding as of {{due_date}}.\n\nKindly arrange payment at your earliest convenience.\n\nYours sincerely,\n{{sender_name}}\nAccounts Receivable, Acme Finance",
      channel: 'email',
    },
    {
      name: 'Pre-Legal Warning',
      subject: 'Urgent: Invoice {{invoice_number}} — Pre-legal warning',
      body: "Dear {{debtor_name}},\n\nDespite our previous notices, invoice {{invoice_number}} for {{amount}} remains unpaid.\n\nPlease be advised that failure to settle this balance within 7 days will result in referral to our legal department.\n\nYours sincerely,\n{{sender_name}}",
      channel: 'email',
    },
    {
      name: 'Legal Notice',
      subject: 'Legal Notice — Invoice {{invoice_number}}',
      body: "Dear {{debtor_name}},\n\nYou are hereby formally notified that invoice {{invoice_number}} for {{amount}} is {{days_overdue}} days past due. This matter is now being referred to legal counsel.\n\nTo avoid legal proceedings, please remit payment immediately.\n\n{{sender_name}}\nLegal Department, Acme Finance",
      channel: 'letter',
    },
  ],
  'nord-supply': [
    {
      name: 'Payment Reminder',
      subject: 'Payment reminder — Invoice {{invoice_number}}',
      body: "Dear {{debtor_name}},\n\nThis is a reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nPlease process payment at your earliest convenience.\n\nKind regards,\n{{sender_name}}\nNord Supply",
      channel: 'email',
    },
    {
      name: 'Urgent Payment Request',
      subject: 'Urgent: Invoice {{invoice_number}} overdue',
      body: "Dear {{debtor_name}},\n\nInvoice {{invoice_number}} for {{amount}} is now {{days_overdue}} days overdue. Please arrange payment immediately or contact us to resolve this matter.\n\nKind regards,\n{{sender_name}}",
      channel: 'email',
    },
    {
      name: 'Final Demand',
      subject: 'Final demand — Invoice {{invoice_number}}',
      body: "Dear {{debtor_name}},\n\nThis is our final demand for payment of invoice {{invoice_number}} for {{amount}}, which is {{days_overdue}} days overdue.\n\nFailure to pay within 5 business days will result in collection proceedings.\n\n{{sender_name}}\nNord Supply",
      channel: 'email',
    },
  ],
}

export async function seedEmailTemplates(
  client: PoolClient,
  companies: CompanyRecord[],
): Promise<TemplateRecord[]> {
  const all: TemplateRecord[] = []

  for (const company of companies) {
    const defs = TEMPLATES[company.slug] ?? []
    for (const def of defs) {
      const id = uuid()
      await client.query(
        `INSERT INTO email_templates (id, company_id, name, subject, body, channel) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, company.id, def.name, def.subject, def.body, def.channel],
      )
      all.push({ id, companyId: company.id, name: def.name })
    }
  }

  console.log(`  ✓ email_templates: ${all.length}`)
  return all
}
