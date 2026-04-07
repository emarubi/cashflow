import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { EmailTemplateService } from '@graphql/services/emailTemplate.service'
import { EmailTemplateRow } from '@graphql/dataloaders'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const emailTemplateResolvers = {
  Query: {
    emailTemplates: (_: unknown, __: unknown, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new EmailTemplateService(ctx.pool)
      return svc.list(ctx.companyId)
    },
  },
  EmailTemplate: {
    companyId: (p: EmailTemplateRow) => p.company_id,
    createdAt: (p: EmailTemplateRow) => p.created_at,
    updatedAt: (p: EmailTemplateRow) => p.updated_at,
  },
}
