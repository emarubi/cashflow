import { DateTimeScalar, DateScalar, JSONScalar } from './scalars'
import { authResolvers } from './auth.resolver'
import { dashboardResolvers } from './dashboard.resolver'
import { invoiceResolvers } from './invoices.resolver'
import { debtorResolvers } from './debtors.resolver'
import { workflowResolvers } from './workflows.resolver'
import { actionResolvers } from './actions.resolver'
import { executionResolvers } from './executions.resolver'
import { paymentResolvers } from './payments.resolver'
import { bankTransactionResolvers } from './bankTransactions.resolver'
import { actionEventResolvers } from './actionEvents.resolver'
import { emailTemplateResolvers } from './emailTemplates.resolver'

export const resolvers = {
  DateTime: DateTimeScalar,
  Date: DateScalar,
  JSON: JSONScalar,

  Query: {
    ...dashboardResolvers.Query,
    ...invoiceResolvers.Query,
    ...debtorResolvers.Query,
    ...workflowResolvers.Query,
    ...paymentResolvers.Query,
    ...bankTransactionResolvers.Query,
    ...actionEventResolvers.Query,
    ...emailTemplateResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...workflowResolvers.Mutation,
    ...executionResolvers.Mutation,
    ...bankTransactionResolvers.Mutation,
    ...actionEventResolvers.Mutation,
  },

  AuthPayload: authResolvers.AuthPayload,
  User: authResolvers.User,
  Invoice: invoiceResolvers.Invoice,
  Debtor: debtorResolvers.Debtor,
  Workflow: workflowResolvers.Workflow,
  Action: actionResolvers.Action,
  Execution: executionResolvers.Execution,
  Payment: paymentResolvers.Payment,
  BankTransaction: bankTransactionResolvers.BankTransaction,
  ActionEvent: actionEventResolvers.ActionEvent,
  EmailTemplate: emailTemplateResolvers.EmailTemplate,
}
