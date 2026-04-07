import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { ActionEventService } from '@graphql/services/actionEvent.service'
import { ActionEventRow } from '@graphql/dataloaders'
import { invalidateDashboardCache } from '@cache/dashboard'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const actionEventResolvers = {
  Query: {
    actionEvents: (_: unknown, args: { first?: number; after?: string; filter?: { executionId?: string; result?: string } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ActionEventService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, args.filter)
    },
  },
  Mutation: {
    sendAction: async (_: unknown, args: { executionId: string; actionId: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ActionEventService(ctx.pool)
      const event = await svc.sendAction(args.executionId, args.actionId, ctx.companyId)
      await invalidateDashboardCache(ctx.companyId)
      return event
    },
  },
  ActionEvent: {
    executionId: (p: ActionEventRow) => p.execution_id,
    actionId:    (p: ActionEventRow) => p.action_id,
    triggeredAt: (p: ActionEventRow) => p.triggered_at,
    execution: (p: ActionEventRow, _: unknown, ctx: ApolloContext) =>
      ctx.loaders.executionById.load(p.execution_id),
    action: (p: ActionEventRow, _: unknown, ctx: ApolloContext) =>
      ctx.loaders.actionById.load(p.action_id),
  },
}
