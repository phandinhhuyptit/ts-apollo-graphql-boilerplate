require('dotenv').config()
import mongoose from 'mongoose'

const {
  MONGO_DEFAULT_HOST_ONE: host01,
  MONGO_DEFAULT_PORT_ONE: port01,
  MONGO_DEFAULT_HOST_TWO: host02,
  MONGO_DEFAULT_PORT_TWO: port02,
  MONGO_DEFAULT_HOST_THREE: host03,
  MONGO_DEFAULT_PORT_THREE: port03,
  MONGO_DEFAULT_DB_NAME: dbName,
} = process.env

let mongoURL = `mongodb://${host01}:${port01}/${dbName}`
if (host02 && port02) {
  mongoURL = `mongodb://${host01}:${port01},${host02}:${port02}/${dbName}`
}
if (host02 && port02 && host03 && port03) {
  mongoURL = `mongodb://${host01}:${port01},${host02}:${port02},${host03}:${port03}/${dbName}`
}

const configs = {
  url: mongoURL,
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  keepAlive: true,
  connectTimeoutMS: 10000,
}

// config mongodb options
// mongoose.set('debug', true)

export interface IDatabase {
  open(): Promise<void>
  close(): Promise<void>
}

class MongoDatabase implements IDatabase {
  private _configs: any

  constructor(configs: object) {
    this._configs = configs
  }

  open() {
    const { url, ...config } = this._configs
    return mongoose.connect(url, config).then(() => {
      console.info('Mongo connect successful!')
    })
  }

  close() {
    return mongoose.disconnect().then(() => {
      console.warn('Mongo disconnect successful!')
    })
  }
}
Object.seal(MongoDatabase)

export default new MongoDatabase(configs)
