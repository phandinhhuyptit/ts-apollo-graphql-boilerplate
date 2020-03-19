import moment from 'moment'
import { createLogger, transports, format } from 'winston'

const customFormat = format.printf(
  ({ timestamp, level, message }) => `[${timestamp}] {${level}:${message}}`
)
const timestampWithTimezone = format(info => {
  info.timestamp = moment().format('YYYYMMDD-HH:mm:ss:SSS')
  return info
})

const options = {
  exitOnError: false, // do not exit on handled exceptions
  level: 'info',
  format: format.combine(timestampWithTimezone(), format.json(), customFormat),
  transports: [
    new transports.Console({
      name: 'info',
      datePattern: 'YYYYMMDD',
      showLevel: true,
      timestamp: true,
      level: 'info', // info and below to rotate
    }),
  ],
}
const logger = createLogger(options)

export default logger
