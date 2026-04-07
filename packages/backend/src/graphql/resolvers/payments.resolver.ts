import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { PaymentService } from '@graphql/services/payment.service'
import { PaymentRow } from '@graphql/dataloaders'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const paymentResolvers = {
  Query: {
    payments: (_: unknown, args: { first?: number; after?: string; filter?: { status?: string; debtorId?: string } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new PaymentService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, args.filter)
    },
  },
  Payment: {
    companyId:  (p: PaymentRow) => p.company_id,
    debtorId:   (p: PaymentRow) => p.debtor_id,
    invoiceId:  (p: PaymentRow) => p.invoice_id,
    receivedAt: (p: PaymentRow) => p.received_at,
    createdAt:  (p: PaymentRow) => p.created_at,
    debtor: (p: PaymentRow, _: unknown, ctx: ApolloContext) =>
      p.debtor_id ? ctx.loaders.debtorById.load(p.debtor_id) : null,
    invoice: (p: PaymentRow, _: unknown, ctx: ApolloContext) =>
      p.invoice_id ? ctx.loaders.invoiceById.load(p.invoice_id) : null,
  },
}
