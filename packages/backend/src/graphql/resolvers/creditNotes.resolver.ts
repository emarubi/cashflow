import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { CreditNoteService } from '@graphql/services/creditNote.service'
import { CreditNoteRow } from '@graphql/dataloaders'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const creditNoteResolvers = {
  Query: {
    creditNotes: (
      _: unknown,
      args: { first?: number; after?: string; filter?: { debtorId?: string; status?: string; currency?: string; search?: string } },
      ctx: ApolloContext,
    ) => {
      requireAuth(ctx)
      const svc = new CreditNoteService(ctx.pool)
      return svc.list(ctx.companyId, args.first ?? 20, args.after, args.filter)
    },
    creditNote: async (_: unknown, args: { id: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new CreditNoteService(ctx.pool)
      const cn = await svc.getById(args.id, ctx.companyId)
      if (!cn) throw new GraphQLError('Credit note not found', { extensions: { code: 'NOT_FOUND' } })
      return cn
    },
  },
  CreditNote: {
    companyId:     (p: CreditNoteRow) => p.company_id,
    debtorId:      (p: CreditNoteRow) => p.debtor_id,
    invoiceId:     (p: CreditNoteRow) => p.invoice_id,
    amountApplied: (p: CreditNoteRow) => parseFloat(p.amount_applied),
    amount:        (p: CreditNoteRow) => parseFloat(p.amount as string),
    issueDate:     (p: CreditNoteRow) => p.issue_date,
    createdAt:     (p: CreditNoteRow) => p.created_at,
    updatedAt:     (p: CreditNoteRow) => p.updated_at,
    debtor: (p: CreditNoteRow, _: unknown, ctx: ApolloContext) =>
      p.debtor_id ? ctx.loaders.debtorById.load(p.debtor_id) : null,
    invoice: (p: CreditNoteRow, _: unknown, ctx: ApolloContext) =>
      p.invoice_id ? ctx.loaders.invoiceById.load(p.invoice_id) : null,
  },
}
