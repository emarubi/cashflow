import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { WorkflowService } from '@graphql/services/workflow.service'
import { WorkflowRow } from '@graphql/dataloaders'
import { invalidateDashboardCache } from '@cache/dashboard'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const workflowResolvers = {
  Query: {
    workflows: (_: unknown, __: unknown, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new WorkflowService(ctx.pool)
      return svc.list(ctx.companyId)
    },
    workflow: async (_: unknown, args: { id: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new WorkflowService(ctx.pool)
      const w = await svc.getById(args.id, ctx.companyId)
      if (!w) throw new GraphQLError('Workflow not found', { extensions: { code: 'NOT_FOUND' } })
      return w
    },
  },
  Mutation: {
    createWorkflow: async (_: unknown, args: { input: { name: string; minContactDelayDays?: number; firstActionLogic?: string; replyTo?: string; isActive?: boolean } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new WorkflowService(ctx.pool)
      const w = await svc.create(ctx.companyId, args.input)
      await invalidateDashboardCache(ctx.companyId)
      return w
    },
    updateWorkflow: async (_: unknown, args: { id: string; input: { name?: string; minContactDelayDays?: number; firstActionLogic?: string; replyTo?: string; isActive?: boolean } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new WorkflowService(ctx.pool)
      const w = await svc.update(args.id, ctx.companyId, args.input)
      if (!w) throw new GraphQLError('Workflow not found', { extensions: { code: 'NOT_FOUND' } })
      await invalidateDashboardCache(ctx.companyId)
      return w
    },
  },
  Workflow: {
    companyId:              (p: WorkflowRow) => p.company_id,
    minContactDelayDays:    (p: WorkflowRow) => p.min_contact_delay_days,
    firstActionLogic:       (p: WorkflowRow) => p.first_action_logic,
    replyTo:                (p: WorkflowRow) => p.reply_to,
    isActive:               (p: WorkflowRow) => p.is_active,
    createdAt:              (p: WorkflowRow) => p.created_at,
    updatedAt:              (p: WorkflowRow) => p.updated_at,
    actions:                (p: WorkflowRow, _: unknown, ctx: ApolloContext) => ctx.loaders.actionsByWorkflowId.load(p.id),
    customerCount:          (p: WorkflowRow) => p.customer_count ?? null,
    performedActionsCount:  (p: WorkflowRow) => p.performed_actions_count ?? null,
    emailOpenRate:          (p: WorkflowRow) => p.email_open_rate ?? null,
    outstanding:            (p: WorkflowRow) => p.outstanding ?? null,
    dso:                    (p: WorkflowRow) => p.dso ?? null,
  },
}
