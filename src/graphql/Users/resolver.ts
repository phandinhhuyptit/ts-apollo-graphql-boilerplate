import { IResolvers } from 'graphql-tools'
import { IUser } from '../../models/user'
import { USER_STATUS } from '../../configs/constant'

const resolver: IResolvers = {
  UserStatus: {
    ...USER_STATUS,
  },

  Query: {
    me: (_, {}, { dataSources, user }) =>
      dataSources.userAPI.findById(user._id),
    users: (_, {}, { dataSources }) => dataSources.userAPI.findAll(),
    userByListIds: (_, { ids }: any, { dataSources }) =>
      dataSources.userAPI.findManyById(ids),
    userById: (_, { _id }, { dataSources }) =>
      dataSources.userAPI.findById(_id),
    userByField: (_, { username }, { dataSources }) =>
      dataSources.userAPI.findUser({ username }),
  },

  Mutation: {
    register: (_, { input }, { dataSources }) =>
      dataSources.userAPI.register(input),

    login: (_, { username, password }, { dataSources }) =>
      dataSources.userAPI.login(username, password),
    forgot: (_, { username, email }: IUser) => {
      return null
    },
    updateUserRole: (_, { input }, { dataSources }) =>
      dataSources.userAPI.updateUserRole(input),
    updateUser: (_, { input }, { dataSources, user }) =>
      dataSources.userAPI.updateUser(input, user),
    blockUser: (_, { _id }, { dataSources }) =>
      dataSources.userAPI.blockUser(_id),
    deleteUserById: (_, { _id }, { dataSources }) =>
      dataSources.userAPI.deleteUserById(_id),
  },
}

export default resolver
