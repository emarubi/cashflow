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

interface UpdateActionInput {
  delayDays?: number
  trigger?: string
  channel?: string
  senderName?: string
  isAutomatic?: boolean
  templateName?: string
  templateSubject?: string
  templateBody?: string
}

export class ActionService {
  constructor(private pool: Pool) {}

  async create(companyId: string, input: CreateActionInput): Promise<ActionRow> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      const { rows: templateRows } = await client.query<{ id: string }>(
        `INSERT INTO email_templates (company_id, name, subject, body, channel)
         VALUES ($1, $2, $3, $4, 'email')
         RETURNING id`,
        [companyId, input.templateName, input.templateSubject, input.templateBody],
      )
      const templateId = templateRows[0].id

      const { rows: orderRows } = await client.query<{ max_order: number | null }>(
        `SELECT MAX(step_order) AS max_order FROM actions WHERE workflow_id = $1`,
        [input.workflowId],
      )
      const nextStepOrder = (orderRows[0].max_order ?? 0) + 1

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

  async update(id: string, companyId: string, input: UpdateActionInput): Promise<ActionRow | null> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Verify ownership via the workflow's company_id
      const { rows: existing } = await client.query<{ id: string; template_id: string | null }>(
        `SELECT a.id, a.template_id
         FROM actions a
         JOIN workflows w ON w.id = a.workflow_id
         WHERE a.id = $1 AND w.company_id = $2`,
        [id, companyId],
      )
      if (existing.length === 0) return null

      // Update the linked email template if template fields are provided
      const { template_id } = existing[0]
      if (template_id && (input.templateName !== undefined || input.templateSubject !== undefined || input.templateBody !== undefined)) {
        const tplSet: string[] = ['updated_at = NOW()']
        const tplParams: unknown[] = []
        let i = 1
        if (input.templateName !== undefined)    { tplSet.push(`name = $${i}`);    tplParams.push(input.templateName);    i++ }
        if (input.templateSubject !== undefined) { tplSet.push(`subject = $${i}`); tplParams.push(input.templateSubject); i++ }
        if (input.templateBody !== undefined)    { tplSet.push(`body = $${i}`);    tplParams.push(input.templateBody);    i++ }
        tplParams.push(template_id)
        await client.query(
          `UPDATE email_templates SET ${tplSet.join(', ')} WHERE id = $${i}`,
          tplParams,
        )
      }

      // Update the action row itself
      const actionSet: string[] = ['updated_at = NOW()']
      const actionParams: unknown[] = []
      let j = 1
      if (input.delayDays   !== undefined) { actionSet.push(`delay_days = $${j}`);   actionParams.push(input.delayDays);   j++ }
      if (input.trigger     !== undefined) { actionSet.push(`trigger = $${j}`);       actionParams.push(input.trigger);     j++ }
      if (input.channel     !== undefined) { actionSet.push(`channel = $${j}`);       actionParams.push(input.channel);     j++ }
      if (input.senderName  !== undefined) { actionSet.push(`sender_name = $${j}`);   actionParams.push(input.senderName);  j++ }
      if (input.isAutomatic !== undefined) { actionSet.push(`is_automatic = $${j}`);  actionParams.push(input.isAutomatic); j++ }
      actionParams.push(id)

      const { rows } = await client.query<ActionRow>(
        `UPDATE actions SET ${actionSet.join(', ')}
         WHERE id = $${j}
         RETURNING id, workflow_id, delay_days, trigger, channel, template_id, sender_name, is_automatic, step_order, created_at, updated_at`,
        actionParams,
      )

      await client.query('COMMIT')
      return rows[0] ?? null
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    // Verify ownership, then delete action + its orphaned template
    const { rows } = await this.pool.query<{ template_id: string | null }>(
      `DELETE FROM actions a
       USING workflows w
       WHERE a.workflow_id = w.id
         AND a.id = $1
         AND w.company_id = $2
       RETURNING a.template_id`,
      [id, companyId],
    )
    if (rows.length === 0) return false

    // Clean up the dedicated template that was created for this action
    const templateId = rows[0].template_id
    if (templateId) {
      await this.pool.query('DELETE FROM email_templates WHERE id = $1', [templateId])
    }
    return true
  }
}
