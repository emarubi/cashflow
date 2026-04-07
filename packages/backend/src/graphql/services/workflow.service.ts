import { Pool } from 'pg'
import { WorkflowRow } from '@graphql/dataloaders'

interface CreateWorkflowInput {
  name: string
  minContactDelayDays?: number
  firstActionLogic?: string
  replyTo?: string
  isActive?: boolean
}

interface UpdateWorkflowInput {
  name?: string
  minContactDelayDays?: number
  firstActionLogic?: string
  replyTo?: string
  isActive?: boolean
}

export class WorkflowService {
  constructor(private pool: Pool) {}

  async list(companyId: string): Promise<WorkflowRow[]> {
    const { rows } = await this.pool.query<WorkflowRow>(
      `SELECT id, company_id, name, min_contact_delay_days, first_action_logic, reply_to, is_active, created_at, updated_at
       FROM workflows WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId],
    )
    return rows
  }

  async getById(id: string, companyId: string): Promise<WorkflowRow | null> {
    const { rows } = await this.pool.query<WorkflowRow>(
      `SELECT id, company_id, name, min_contact_delay_days, first_action_logic, reply_to, is_active, created_at, updated_at
       FROM workflows WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    )
    return rows[0] ?? null
  }

  async create(companyId: string, input: CreateWorkflowInput): Promise<WorkflowRow> {
    const { rows } = await this.pool.query<WorkflowRow>(
      `INSERT INTO workflows (company_id, name, min_contact_delay_days, first_action_logic, reply_to, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, company_id, name, min_contact_delay_days, first_action_logic, reply_to, is_active, created_at, updated_at`,
      [
        companyId,
        input.name,
        input.minContactDelayDays ?? 5,
        input.firstActionLogic ?? 'standard',
        input.replyTo ?? null,
        input.isActive ?? true,
      ],
    )
    return rows[0]
  }

  async update(id: string, companyId: string, input: UpdateWorkflowInput): Promise<WorkflowRow | null> {
    const setClauses: string[] = ['updated_at = NOW()']
    const params: unknown[] = []
    let paramIdx = 1

    if (input.name !== undefined) {
      setClauses.push(`name = $${paramIdx}`)
      params.push(input.name)
      paramIdx++
    }
    if (input.minContactDelayDays !== undefined) {
      setClauses.push(`min_contact_delay_days = $${paramIdx}`)
      params.push(input.minContactDelayDays)
      paramIdx++
    }
    if (input.firstActionLogic !== undefined) {
      setClauses.push(`first_action_logic = $${paramIdx}`)
      params.push(input.firstActionLogic)
      paramIdx++
    }
    if (input.replyTo !== undefined) {
      setClauses.push(`reply_to = $${paramIdx}`)
      params.push(input.replyTo)
      paramIdx++
    }
    if (input.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIdx}`)
      params.push(input.isActive)
      paramIdx++
    }

    params.push(id, companyId)
    const { rows } = await this.pool.query<WorkflowRow>(
      `UPDATE workflows SET ${setClauses.join(', ')}
       WHERE id = $${paramIdx} AND company_id = $${paramIdx + 1}
       RETURNING id, company_id, name, min_contact_delay_days, first_action_logic, reply_to, is_active, created_at, updated_at`,
      params,
    )
    return rows[0] ?? null
  }
}
