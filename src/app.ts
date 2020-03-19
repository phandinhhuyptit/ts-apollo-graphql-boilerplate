require('dotenv').config()

import http from 'http'
import cors from 'cors'
import express from 'express'
import bodyParser from 'body-parser'
import get from 'lodash.get'

import { ApolloServer } from 'apollo-server-express'
import schema from './graphql'

import { createStore } from './models'
import UserAPI from './datasources/user'
import { getUser } from './utils/auth'
import { up } from './utils/create_user'

import logger from './external-libs/logger'

const playground: boolean =
  (process.env.APOLLO_PLAYGROUND === 'true' && true) || false
const introspection: boolean =
  (process.env.APOLLO_INTROSPECTION === 'true' && true) || false
const debug: boolean = (process.env.APOLLO_DEBUG === 'true' && true) || false

const whitelist: string[] = process.env.SERVER_REQUEST_WHITE_LIST
const corsEnabled: string = process.env.SERVER_CORS_ENABLED
const path: string = process.env.APOLLO_PATH

const store = createStore()
const dataSources = () => ({
  userAPI: new UserAPI({ store: store.user }),
})

// init user admin
up(store.user)

const app = express()
// parse application/json
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let corsOptions: object = {
  origin: function(origin: string, callback: any) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed access!'))
    }
  },
}

if (corsEnabled !== 'true') {
  corsOptions = {}
}

const loggingMiddleware = (req, res, next) => {
  if (
    req.body.operationName &&
    !['IntrospectionQuery'].includes(req.body.operationName)
  ) {
    const getIP =
      (
        req.headers['X-Forwarded-For'] ||
        req.headers['x-forwarded-for'] ||
        ''
      ).split(',')[0] || req.client.remoteAddress
    const ip = (getIP.length < 15 && getIP) || getIP.slice(7) || req.ip
    const { query, ...body } = req.body
    if (ip !== '127.0.0.1') {
      logger.info(`"[GraphQL.request] ${ip}",body:` + JSON.stringify(body))
    }
  }
  next()
}

// the function that sets up the global context for each resolver, using the req
const context = async ({ req, res }) => {
  // simple auth check on every request
  const { user, token, refreshToken } = await getUser(req.headers, store.user)

  if (token && refreshToken) {
    res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token')
    res.set('x-token', token)
    res.set('x-refresh-token', refreshToken)
  }
  return {
    user,
    res,
  }
}

app.use(cors(corsOptions))
app.use(loggingMiddleware)
// error handler
app.use((err, req, res, next) => {
  // render the error page
  logger.error(err.message)
  res.status(err.status || 500)
  res.json({ message: 'Not allowed access!' })
})

const server = new ApolloServer({
  schema,
  dataSources,
  context,
  introspection,
  playground,
  debug,
  formatError: (error: any) => {
    // filter whatever errors your don't want to log
    logger.error(`"[GraphQL.error]",body:${JSON.stringify(error)}`)
    return {
      message: error.message,
      errorCode: (error.extensions && error.extensions.code) || null,
    }
  },
  formatResponse: (response: any) => {
    // don't log auth mutations or schema requests
    const name = Object.keys(get(response, 'data') || { unknown: 0 })[0]
    if (!['__schema'].includes(name)) {
      logger.info(
        `"[GraphQL.response] ${name}",body:` + JSON.stringify(response)
      )
    }
    return response
  },
})

server.applyMiddleware({ app, path, cors: false })
const httpServer = http.createServer(app)
server.installSubscriptionHandlers(httpServer)

export default httpServer
