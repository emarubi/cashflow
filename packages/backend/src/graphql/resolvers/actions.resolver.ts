import { GraphQLError } from 'graphql'
import { ApolloContext } from '@graphql/context'
import { ActionRow } from '@graphql/dataloaders'
import { ActionService } from '@graphql/services/action.service'
import { dunningQueue } from '@queues/dunning.queue'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

interface CreateActionInput {
  workflowId: string
  delayDays: number
  trigger: string
  channel: string
  senderName?: string
  isAutomatic?: boolean
  templateName: string
  templateSubject: string
  templateBody: string
}

interface UpdateActionInput {
  delayDays?: number
  trigger?: string
  channel?: string
  senderName?: string
  isAutomatic?: boolean
  templateName?: string
  templateSubject?: string
  templateBody?: string
}

interface SendTestEmailInput {
  to: string
  subject: string
  body: string
}

export const actionResolvers = {
  Mutation: {
    createAction: async (_: unknown, args: { input: CreateActionInput }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ActionService(ctx.pool)
      return svc.create(ctx.companyId, args.input)
    },
    updateAction: async (_: unknown, args: { id: string; input: UpdateActionInput }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ActionService(ctx.pool)
      const action = await svc.update(args.id, ctx.companyId, args.input)
      if (!action) throw new GraphQLError('Action not found', { extensions: { code: 'NOT_FOUND' } })
      return action
    },
    deleteAction: async (_: unknown, args: { id: string }, ctx: ApolloContext) => {
      requireAuth(ctx)
      const svc = new ActionService(ctx.pool)
      return svc.delete(args.id, ctx.companyId)
    },
    sendTestEmail: async (_: unknown, args: { input: SendTestEmailInput }, ctx: ApolloContext) => {
      requireAuth(ctx)
      await dunningQueue.add(
        'test-email',
        {
          executionId: 'test',
          actionId: 'test',
          invoiceId: 'test',
          companyId: ctx.companyId,
          test: true,
          testTo: args.input.to,
          testSubject: args.input.subject,
          testBody: args.input.body,
        },
        { attempts: 1 },
      )
      return true
    },
  },
  Action: {
    workflowId:  (p: ActionRow) => p.workflow_id,
    delayDays:   (p: ActionRow) => p.delay_days,
    templateId:  (p: ActionRow) => p.template_id,
    senderName:  (p: ActionRow) => p.sender_name,
    isAutomatic: (p: ActionRow) => p.is_automatic,
    stepOrder:   (p: ActionRow) => p.step_order,
    createdAt:   (p: ActionRow) => p.created_at,
    updatedAt:   (p: ActionRow) => p.updated_at,
    template: (p: ActionRow, _: unknown, ctx: ApolloContext) =>
      p.template_id ? ctx.loaders.emailTemplateById.load(p.template_id) : null,
    workflow: (p: ActionRow, _: unknown, ctx: ApolloContext) =>
      ctx.loaders.workflowById.load(p.workflow_id),
  },
}
