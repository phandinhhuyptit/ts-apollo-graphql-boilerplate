import { Document, Schema, model, Model } from 'mongoose'

export interface IUser extends Document {
  username?: string
  password?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: number
  avatar?: string
  role?: number
  status?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface UserModel extends Model<IUser> {}

export class User {
  private _model: Model<IUser>

  constructor() {
    const schema: Schema = new Schema({
      username: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      firstName: String,
      lastName: String,
      phone: String,
      avatar: String,
      role: {
        type: Number,
        default: 2,
      },
      status: Number,
      createdAt: {
        type: Date,
        default: new Date(),
      },
      updatedAt: Date,
    })

    this._model = model<IUser>('User', schema)
  }

  get model(): Model<IUser> {
    return this._model
  }
}
