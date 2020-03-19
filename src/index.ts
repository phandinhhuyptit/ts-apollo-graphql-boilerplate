require('dotenv').config()
import http, { Server } from 'http'
import mongoose from 'mongoose'
import app from './app'
import database from './external-libs/mongoose'
import logger from './external-libs/logger'

const PORT: number = parseInt(process.env.PORT, 10) || 9000

let server: Server
const closeServer = () => {
  database
    .close()
    .finally(() => {
      console.error('Mongo disconnected through app termination')
      server.close((error: any) => {
        if (error) {
          console.error('Unable to close server normaly:', error)
          process.exit(1)
        } else {
          console.warn('Server shutdown successful!')
          process.exit(0)
        }
      })
    })
    .catch(() => {
      console.warn('Process exit!')
      process.exit(0)
    })
}

// The 'unhandledRejection' event is emitted whenever a Promise is rejected and no error handler is attached
// to the promise within a turn of the event loop. When programming with Promises, exceptions are encapsulated as
// "rejected promises". Rejections can be caught and handled using promise.catch() and are propagated through
// a Promise chain. The 'unhandledRejection' event is useful for detecting and keeping track of promises that were
// rejected whose rejections have not yet been handled.
process.on('unhandledRejection', error => {
  console.error('Uncaught Error: ' + error)
})

process.on('uncaughtException', error => {
  console.error('Uncaught Error: ' + error)
})

// exit server when close app
process.on('SIGINT', closeServer)

database
  .open()
  .then(() => {
    mongoose.connection.on('reconnectFailed', () => {
      console.error('Mongo disconnect!')
      closeServer()
    })

    // wait for connecting to db successfully then start server
    // The `listen` method launches a web server.
    app.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`)
      logger.info(`🚀 Subscriptions ready at ws://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error(err)
    closeServer()
  })
