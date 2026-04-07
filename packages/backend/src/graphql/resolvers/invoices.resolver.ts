import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { InvoiceService } from '@graphql/services/invoice.service'
import { InvoiceRow } from '@graphql/dataloaders'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const invoiceResolvers = {
  Query: {
    invoices: (_: unknown, args: { first?: number; after?: string; filter?: { status?: string; debtorId?: string; search?: string } }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new InvoiceService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, args.filter)
    },
    invoice: async (_: unknown, args: { id: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new InvoiceService(ctx.pool)
      const inv = await svc.getById(args.id, ctx.companyId)
      if (!inv) throw new GraphQLError('Invoice not found', { extensions: { code: 'NOT_FOUND' } })
      return inv
    },
  },
  Invoice: {
    companyId:   (p: InvoiceRow) => p.company_id,
    debtorId:    (p: InvoiceRow) => p.debtor_id,
    issueDate:   (p: InvoiceRow) => p.issue_date,
    dueDate:     (p: InvoiceRow) => p.due_date,
    paidAt:      (p: InvoiceRow) => p.paid_at,
    createdAt:   (p: InvoiceRow) => p.created_at,
    updatedAt:   (p: InvoiceRow) => p.updated_at,
    debtor:      (p: InvoiceRow, _: unknown, ctx: ApolloContext) => ctx.loaders.debtorById.load(p.debtor_id),
    execution:   (p: InvoiceRow, _: unknown, ctx: ApolloContext) => ctx.loaders.executionByInvoiceId.load(p.id),
  },
}
