import { Pool } from 'pg'
import { ActionRow } from '@graphql/dataloaders'

interface CreateActionInput {
  workflowId: string
  delayDays: number
  trigger: string
  channel: string
  senderName?: string
  isAutomatic?: boolean
  templateName: string
  templateSubject: string
  templateBody: string
}

export class ActionService {
  constructor(private pool: Pool) {}

  async create(companyId: string, input: CreateActionInput): Promise<ActionRow> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Create the email template first
      const { rows: templateRows } = await client.query<{ id: string }>(
        `INSERT INTO email_templates (company_id, name, subject, body, channel)
         VALUES ($1, $2, $3, $4, 'email')
         RETURNING id`,
        [companyId, input.templateName, input.templateSubject, input.templateBody],
      )
      const templateId = templateRows[0].id

      // Determine the next step_order for this workflow
      const { rows: orderRows } = await client.query<{ max_order: number | null }>(
        `SELECT MAX(step_order) AS max_order FROM actions WHERE workflow_id = $1`,
        [input.workflowId],
      )
      const nextStepOrder = (orderRows[0].max_order ?? 0) + 1

      // Create the action referencing the new template
      const { rows } = await client.query<ActionRow>(
        `INSERT INTO actions
           (workflow_id, delay_days, trigger, channel, template_id, sender_name, is_automatic, step_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, workflow_id, delay_days, trigger, channel, template_id, sender_name, is_automatic, step_order, created_at, updated_at`,
        [
          input.workflowId,
          input.delayDays,
          input.trigger,
          input.channel,
          templateId,
          input.senderName ?? null,
          input.isAutomatic ?? true,
          nextStepOrder,
        ],
      )

      await client.query('COMMIT')
      return rows[0]
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
}
