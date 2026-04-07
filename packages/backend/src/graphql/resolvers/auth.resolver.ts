import { GraphQLError } from 'graphql'
import { AuthService } from '@graphql/services/auth.service'
import { ApolloContext } from '@graphql/context'
import { redis } from '@cache/redis'

export const authResolvers = {
  Mutation: {
    login: async (_: unknown, args: { email: string; password: string; companySlug: string }, ctx: ApolloContext) => {
      const svc = new AuthService(ctx.pool, redis)
      return svc.login(args.email, args.password, args.companySlug)
    },
    refreshToken: async (_: unknown, args: { token: string }, ctx: ApolloContext) => {
      const svc = new AuthService(ctx.pool, redis)
      return svc.refreshToken(args.token)
    },
    logout: async (_: unknown, __: unknown, ctx: ApolloContext) => {
      if (ctx.authenticated) {
        const svc = new AuthService(ctx.pool, redis)
        await svc.logout(ctx.userId)
      }
      return true
    },
  },
  AuthPayload: {
    user: (parent: { user: unknown }) => parent.user,
  },
  User: {
    companyId: (parent: { company_id: string }) => parent.company_id,
    createdAt: (parent: { created_at: Date }) => parent.created_at,
    updatedAt: (parent: { updated_at: Date }) => parent.updated_at,
  },
}
