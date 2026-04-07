import { ApolloContext } from '@graphql/context'
import { DashboardService } from '@graphql/services/dashboard.service'
import { getDashboardCache, setDashboardCache } from '@cache/dashboard'
import { GraphQLError } from 'graphql'

function requireAuth(ctx: ApolloContext): void {
  if (!ctx.authenticated) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHORIZED' } })
}

export const dashboardResolvers = {
  Query: {
    dashboard: async (_: unknown, __: unknown, ctx: ApolloContext) => {
      requireAuth(ctx)
      const cached = await getDashboardCache(ctx.companyId)
      if (cached) return cached
      const svc = new DashboardService(ctx.pool)
      const data = await svc.getDashboard(ctx.companyId)
      await setDashboardCache(ctx.companyId, data)
      return data
    },
  },
}
