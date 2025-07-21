/* eslint-disable */
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, json, prettyPrint } = format;

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console({
      format: combine(
        timestamp(),
        prettyPrint()
      )
    })
  ]
});

export { logger };
