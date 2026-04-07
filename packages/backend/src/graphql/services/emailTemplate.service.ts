import { Pool } from 'pg'
import { EmailTemplateRow } from '@graphql/dataloaders'

export class EmailTemplateService {
  constructor(private pool: Pool) {}

  async list(companyId: string): Promise<EmailTemplateRow[]> {
    const { rows } = await this.pool.query<EmailTemplateRow>(
      `SELECT id, company_id, name, subject, body, channel, created_at, updated_at
       FROM email_templates WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId],
    )
    return rows
  }

  async getById(id: string, companyId: string): Promise<EmailTemplateRow | null> {
    const { rows } = await this.pool.query<EmailTemplateRow>(
      `SELECT id, company_id, name, subject, body, channel, created_at, updated_at
       FROM email_templates WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }
}
