import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { ExecutionService } from '@graphql/services/execution.service'
import { ExecutionRow } from '@graphql/dataloaders'
import { invalidateDashboardCache } from '@cache/dashboard'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const executionResolvers = {
  Mutation: {
    pauseExecution: async (_: unknown, args: { executionId: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ExecutionService(ctx.pool)
      const e = await svc.pause(args.executionId, ctx.companyId)
      await invalidateDashboardCache(ctx.companyId)
      return e
    },
    resumeExecution: async (_: unknown, args: { executionId: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ExecutionService(ctx.pool)
      const e = await svc.resume(args.executionId, ctx.companyId)
      await invalidateDashboardCache(ctx.companyId)
      return e
    },
    ignoreAction: async (_: unknown, args: { executionId: string; actionId: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ExecutionService(ctx.pool)
      const event = await svc.ignore(args.executionId, args.actionId, ctx.companyId)
      await invalidateDashboardCache(ctx.companyId)
      return event
    },
  },
  Execution: {
    invoiceId:       (p: ExecutionRow) => p.invoice_id,
    workflowId:      (p: ExecutionRow) => p.workflow_id,
    currentActionId: (p: ExecutionRow) => p.current_action_id,
    nextRunAt:       (p: ExecutionRow) => p.next_run_at,
    createdAt:       (p: ExecutionRow) => p.created_at,
    updatedAt:       (p: ExecutionRow) => p.updated_at,
    invoice: (p: ExecutionRow, _: unknown, ctx: ApolloContext) => ctx.loaders.invoiceById.load(p.invoice_id),
    workflow: (p: ExecutionRow, _: unknown, ctx: ApolloContext) => ctx.loaders.workflowById.load(p.workflow_id),
    currentAction: (p: ExecutionRow, _: unknown, ctx: ApolloContext) =>
      p.current_action_id ? ctx.loaders.actionById.load(p.current_action_id) : null,
    actionEvents: (p: ExecutionRow, _: unknown, ctx: ApolloContext) =>
      ctx.loaders.actionEventsByExecutionId.load(p.id),
  },
}
