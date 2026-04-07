import { GraphQLScalarType, Kind } from 'graphql'

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
})

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  serialize: (value) => {
    if (value instanceof Date) return value.toISOString().split('T')[0]
    if (typeof value === 'string') return value.split('T')[0]
    return value
  },
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
})

export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      try { return JSON.parse(ast.value) } catch { return ast.value }
    }
    return null
  },
})
