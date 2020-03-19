require('dotenv').config()
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthenticationError } from 'apollo-server'

import { IUser, UserModel } from '../models/user'
import logger from '../external-libs/logger'

const { JWT_SECRET, JWT_EXPIRESIN, JWT_EXPIRESIN_REFRESH } = process.env

const encryptPassword = (password: string) => {
  try {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
  } catch (err) {
    console.error(err)
    throw new Error('Have an error. Please try again!')
  }
}

const comparePassword = (
  currentPassword: string,
  candidatePassword: string
) => {
  return bcrypt.compareSync(candidatePassword, currentPassword)
}

const createTokens = ({ _id, role, username }: IUser) => {
  const createToken = jwt.sign(
    {
      user: { _id, role, username },
    },
    JWT_SECRET,
    {
      expiresIn: parseInt(JWT_EXPIRESIN),
    }
  )

  const createRefreshToken = jwt.sign(
    {
      user: { _id },
    },
    JWT_SECRET,
    {
      expiresIn: parseInt(JWT_EXPIRESIN_REFRESH),
    }
  )

  return Promise.all([createToken, createRefreshToken])
}

const refreshTokens = async (token: string, User: UserModel) => {
  try {
    const {
      user: { _id },
    } = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(_id)
    if (user) {
      const [newToken, newFreshToken] = await createTokens(user)
      return {
        token: newToken,
        refreshToken: newFreshToken,
        user: {
          _id: user._id,
          role: user.role,
          username: user.username,
        },
      }
    }
    return null
  } catch (err) {
    return null
  }
}

const getTokenFromRequest = (headers: any) => {
  const { 'x-token': token, 'x-refresh-token': refreshToken } = headers
  return [token, refreshToken]
}

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

const getUser = async (headers: any, User: UserModel) => {
  try {
    const auth = {
      user: null,
      token: null,
      refreshToken: null,
    }
    const [token, refreshToken] = getTokenFromRequest(headers)
    if (!token && !refreshToken) { return auth }
    if (token) {
      const result = await verifyToken(token)
      const id = (result && result.user && result.user._id) || null
      const findUser = await User.findOne({ _id: id, status: 2 })
      if (findUser) {
        auth.user = result.user
        return auth
      }
    }
    const newTokens = await refreshTokens(refreshToken, User)
    if (newTokens && newTokens.token && newTokens.refreshToken) {
      auth.user = newTokens.user
      auth.token = newTokens.token
      auth.refreshToken = newTokens.refreshToken
    }
    return auth
  } catch (error) {
    logger.error('Error: ' + error)
    throw new AuthenticationError('Session expired!')
  }
}

export { createTokens, getUser, encryptPassword, comparePassword }
