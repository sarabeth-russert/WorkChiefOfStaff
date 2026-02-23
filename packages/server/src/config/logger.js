import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'adventureland-server' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0 && meta.service !== 'adventureland-server') {
            metaStr = JSON.stringify(meta);
          }
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    }),
    // Write all logs to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.uncolorize()
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.uncolorize()
    })
  ]
});

export default logger;
