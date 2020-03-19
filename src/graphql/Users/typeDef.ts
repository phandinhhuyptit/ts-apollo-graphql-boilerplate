import { gql } from 'apollo-server'
import { USER_STATUS } from '../../configs/constant'

export default gql`
  enum UserStatus {
    ${Object.keys(USER_STATUS).join('\n')}
  }

  extend type Query {
    # get current user
    me: User @hasRole(roles: [ADMIN,USER])
    # find all user
    users: [User] @hasRole(roles: [ADMIN,USER])
    # find list user by ids
    userByListIds(ids: [ID!]!): [User] @hasRole(roles: [ADMIN,USER])
    # find one user by id
    userById(_id: ID!): User @hasRole(roles: [ADMIN,USER])
    # find one user by username
    userByField(username: String!): User @hasRole(roles: [ADMIN,USER])
  }

  extend type Mutation {
    register(input: RegisterUserInput!): UserResponseStatus
    login(username: String!, password: String!): AuthPayload
    forgot(email: String!, username: String!): UserResponseStatus
    updateUserRole(input: UpdateRoleInput!): UserResponseStatus @hasRole(roles: [ADMIN])
    updateUser(input: UpdateUserInput!): UserResponseStatus @hasRole(roles: [ADMIN,USER])
    blockUser(_id: ID!): UserResponseStatus @hasRole(roles: [ADMIN])
    deleteUserById(_id: ID!): UserResponseStatus @hasRole(roles: [ADMIN])
  }

  type User {
    _id: ID
    username: String
    firstName: String
    lastName: String
    email: String
    phone: String
    avatar: String
    role: Role
    status: UserStatus
    createdAt: String
    updatedAt: String
  }

  input RegisterUserInput {
    username: String!
    password: String!
    firstName: String
    lastName: String
    email: String!
    phone: String
    avatar: String
    status: UserStatus
  }

  input UpdateUserInput {
    _id: ID!
    password: String
    firstName: String
    lastName: String
    email: String
    phone: String
    avatar: String
    status: UserStatus
  }

  input UpdateRoleInput {
    _id: ID!
    role: Role!
  }

  # Auth payload Type
  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User
  }

  # Status Update User
  type UserResponseStatus {
    message: String!
    user: User
  }
`
