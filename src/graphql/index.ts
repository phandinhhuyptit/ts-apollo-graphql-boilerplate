import merge from 'lodash.merge'
import { gql } from 'apollo-server'
import { GraphQLSchema } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { resolver as UserResolver, typeDef as User } from './Users'
import { schemaDirectives, typeDef as Directive } from './Directive'
import { ROLES } from '../configs/constant'

// we create empty main types, we can later extend them in the shards
const Query = gql`
  enum Role {
    ${Object.keys(ROLES).join('\n')}
  }
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`
const resolvers = {
  Role: {
    ...ROLES,
  },
}

const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs: [Query, User, Directive],
  resolvers: merge(resolvers, UserResolver),
  schemaDirectives,
})

export default schema
