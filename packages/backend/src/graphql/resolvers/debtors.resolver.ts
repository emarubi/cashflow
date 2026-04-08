import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { DebtorService } from '@graphql/services/debtor.service'
import { InvoiceService } from '@graphql/services/invoice.service'
import { DebtorRow } from '@graphql/dataloaders'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const debtorResolvers = {
  Query: {
    debtors: (_: unknown, args: { first?: number; after?: string; filter?: { rating?: string; workflowId?: string; search?: string } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new DebtorService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, args.filter)
    },
    debtor: async (_: unknown, args: { id: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new DebtorService(ctx.pool)
      const d = await svc.getById(args.id, ctx.companyId)
      if (!d) throw new GraphQLError('Debtor not found', { extensions: { code: 'NOT_FOUND' } })
      return d
    },
  },
  Debtor: {
    companyId:        (p: DebtorRow) => p.company_id,
    hasPaymentMethod: (p: DebtorRow) => p.has_payment_method,
    assignedUserId:   (p: DebtorRow) => p.assigned_user_id,
    workflowId:       (p: DebtorRow) => p.workflow_id,
    createdAt:        (p: DebtorRow) => p.created_at,
    updatedAt:        (p: DebtorRow) => p.updated_at,
    outstandingAmount: (p: DebtorRow, _: unknown, ctx: ApolloContext) => {
      const svc = new DebtorService(ctx.pool)
      return svc.getOutstandingAmount(p.id, ctx.companyId)
    },
    avgPaymentDelayDays: (p: DebtorRow, _: unknown, ctx: ApolloContext) => {
      const svc = new DebtorService(ctx.pool)
      return svc.getAvgPaymentDelayDays(p.id, ctx.companyId)
    },
    lastContactedAt: (p: DebtorRow, _: unknown, ctx: ApolloContext) => {
      const svc = new DebtorService(ctx.pool)
      return svc.getLastContactedAt(p.id, ctx.companyId)
    },
    assignedUser: (p: DebtorRow, _: unknown, ctx: ApolloContext) =>
      p.assigned_user_id ? ctx.loaders.userById.load(p.assigned_user_id) : null,
    workflow: (p: DebtorRow, _: unknown, ctx: ApolloContext) =>
      p.workflow_id ? ctx.loaders.workflowById.load(p.workflow_id) : null,
    invoices: (p: DebtorRow, args: { first?: number; after?: string }, ctx: ApolloContext) => {
      const svc = new InvoiceService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, { debtorId: p.id })
    },
  },
}
