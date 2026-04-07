import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { BankTransactionService, BankTransactionRow } from '@graphql/services/bankTransaction.service'
import { invalidateDashboardCache } from '@cache/dashboard'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const bankTransactionResolvers = {
  Query: {
    bankTransactions: (_: unknown, args: { first?: number; after?: string; filter?: { status?: string } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new BankTransactionService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, args.filter)
    },
  },
  Mutation: {
    applyBankTransaction: async (_: unknown, args: { input: { bankTransactionId: string; paymentId: string; appliedAmount: number } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new BankTransactionService(ctx.pool)
      const bt = await svc.applyTransaction(args.input.bankTransactionId, args.input.paymentId, args.input.appliedAmount, ctx.companyId)
      await invalidateDashboardCache(ctx.companyId)
      return bt
    },
  },
  BankTransaction: {
    companyId:     (p: BankTransactionRow) => p.company_id,
    appliedAmount: (p: BankTransactionRow) => parseFloat(p.applied_amount),
    paymentId:     (p: BankTransactionRow) => p.payment_id,
    externalSync:  (p: BankTransactionRow) => p.external_sync,
    postedAt:      (p: BankTransactionRow) => p.posted_at,
    createdAt:     (p: BankTransactionRow) => p.created_at,
    updatedAt:     (p: BankTransactionRow) => p.updated_at,
    payment: (p: BankTransactionRow, _: unknown, ctx: ApolloContext) =>
      p.payment_id ? ctx.loaders.paymentById.load(p.payment_id) : null,
  },
}
