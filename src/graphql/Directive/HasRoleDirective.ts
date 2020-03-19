import { AuthenticationError } from 'apollo-server'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import {
  GraphQLDirective,
  DirectiveLocation,
  GraphQLList,
  defaultFieldResolver,
} from 'graphql'

class HasRoleDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(directiveName: any, schema: any) {
    return new GraphQLDirective({
      name: 'hasRole',
      locations: [DirectiveLocation.FIELD_DEFINITION],
      args: {
        roles: {
          type: new GraphQLList(schema.getType('Role')),
        },
      },
    })
  }
  visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field
    const roles = this.args.roles
    field.resolve = async function(...args: any) {
      const [, , context] = args
      if (!context.user) {
        throw new AuthenticationError('Not authorized')
      }
      const userRoles = context.user.role
      if (roles.indexOf(userRoles) !== -1) {
        const result = await resolve.apply(this, args)
        return result
      }
      throw new AuthenticationError('You are not authorized for this resource')
    }
  }
}
export default HasRoleDirective
