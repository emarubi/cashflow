import { ApolloContext } from '@graphql/context'
import { ActionRow } from '@graphql/dataloaders'

export const actionResolvers = {
  Action: {
    workflowId:  (p: ActionRow) => p.workflow_id,
    delayDays:   (p: ActionRow) => p.delay_days,
    templateId:  (p: ActionRow) => p.template_id,
    senderName:  (p: ActionRow) => p.sender_name,
    stepOrder:   (p: ActionRow) => p.step_order,
    createdAt:   (p: ActionRow) => p.created_at,
    updatedAt:   (p: ActionRow) => p.updated_at,
    template: (p: ActionRow, _: unknown, ctx: ApolloContext) =>
      p.template_id ? ctx.loaders.emailTemplateById.load(p.template_id) : null,
  },
}
