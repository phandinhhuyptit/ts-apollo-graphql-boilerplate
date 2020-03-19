import { DataSource, DataSourceConfig } from 'apollo-datasource'
import DataLoader from 'dataloader'
import { encryptPassword, comparePassword, createTokens } from '../utils/auth'
import { IUser, UserModel } from '../models/user'

export interface IUserCacheAPI {
  store: UserModel
}

class UserAPI<TContext> extends DataSource {
  private context!: TContext
  private store!: UserModel

  private loader = new DataLoader(async (ids: string[]) => {
    const docs = await this.store.find({ _id: { $in: ids } })
    const idMap = docs.reduce((result, item) => {
      result[item._id] = item
      return result
    }, {})
    return ids.map(id => idMap[id])
  })

  constructor({ store }: IUserCacheAPI) {
    super()
    this.store = store
  }

  initialize(config: DataSourceConfig<TContext>): void {
    this.context = config.context
  }

  async findById(_id: string) {
    // const user = await this.store.findById(id)
    const user = await this.loader.load(_id)

    if (user) {
      return user
    }
    return null
  }

  async findUser(info: IUser) {
    const user = await this.store.findOne(info)
    return user
  }

  async findManyById(ids: string[]) {
    return Promise.all(ids.map(id => this.findById(id)))
  }

  async findAll() {
    const users = await this.store.find()
    return users
  }

  async register({ username, email, password = '', ...info }: IUser) {
    const existingUser = await this.store.findOne({ email })

    if (existingUser) {
      throw new Error('Email already used')
    }
    if (!password) {
      throw new Error('Password is not empty')
    }

    const hashedPassword = await encryptPassword(password)

    const newDoc = new this.store({
      email,
      password: hashedPassword,
      username,
      ...info,
    })
    const saveDoc = await newDoc.save()
    if (saveDoc) {
      return {
        message: 'Created user.',
        user: saveDoc,
      }
    }
    throw new Error('Have an error. Please try again!')
  }

  async login(username: string, password: string) {
    const existingUser = await this.store
      .findOne({
        $or: [{ username }, { email: username }],
      })
      .lean()
      .exec()

    if (!existingUser) {
      throw new Error('This account is not exist')
    }

    const valid = await comparePassword(existingUser.password, password)
    if (!valid) {
      throw new Error('Username or password invalid')
    }

    const [token, refreshToken] = await createTokens(existingUser)
    return {
      user: existingUser,
      token,
      refreshToken,
    }
  }

  async updateUserRole({ _id, role }: IUser) {
    const updateDoc = await this.store.findOneAndUpdate(
      {
        _id,
      },
      { role, updatedAt: new Date() }
    )
    if (updateDoc) {
      const data = await this.findById(_id)
      return {
        message: 'Updated role',
        user: data,
      }
    }
    throw new Error('Have an error. Please check and try again!')
  }

  async updateUser(input: IUser) {
    const { _id, ...data } = input
    const updateDoc = await this.store.findOneAndUpdate(
      {
        _id,
      },
      { ...data, updatedAt: new Date() }
    )
    if (updateDoc) {
      const data = await this.findById(_id)
      return {
        message: 'Updated user',
        user: data,
      }
    }
    throw new Error('Have an error. Please check and try again!')
  }

  async blockUser(_id: string) {
    const updateDoc = await this.store.findByIdAndUpdate(
      { _id },
      { status: 3, updatedAt: new Date() }
    )

    if (updateDoc) {
      return {
        message: 'User are blocking!',
        user: updateDoc,
      }
    }
    throw new Error('Have an error. Please check and try again!')
  }

  async deleteUserById(_id: string) {
    await this.store.deleteOne({ _id })
    return {
      message: 'User are deleted!',
      user: { _id },
    }
  }
}

export default UserAPI
