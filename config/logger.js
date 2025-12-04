const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
};

// Console format (simple, readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// File format
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Define transports (where logs are saved)
const transports = [
  // Console output (simple text)
  new winston.transports.Console({
    format: consoleFormat
  }),

  // Error logs file 
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: fileFormat
  }),

  // Security events file (authentication, authorization)
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/security.log'),
    level: 'warn',
    format: fileFormat
  }),

  // All logs combined 
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: fileFormat
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'http',
  levels,
  transports,
});

module.exports = logger;
