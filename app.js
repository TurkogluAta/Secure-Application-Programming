// Load environment variables from .env file
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const csrf = require('csurf');
const helmet = require('helmet');
const winston = require('./config/logger');

var apiRouter = require('./routes/api');

var app = express();

// SECURE: Session configuration with proper security settings
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false,   // Don't create session until something stored
  cookie: {
    httpOnly: true,           // Prevent client-side JS from reading the cookie
    secure: false,            // Set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict'        // CSRF protection - cookie only sent to same site
  }
}));

// SECURE: Security Headers with Helmet.js
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],  // unsafe-inline needed for inline styles
      imgSrc: ["'self'", "data:", "https:"],    // Allow external images (pet photos)
      connectSrc: ["'self'"],                   // API calls to own server only
      objectSrc: ["'none'"]                     // Block Flash/Java plugins
    }
  },
  // Prevents clickjacking attacks
  frameguard: {
    action: 'deny'
  },
  // Prevents MIME type sniffing
  noSniff: true,
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Strict-Transport-Security (HSTS) - Force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Referrer Policy - Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// SECURE: HTTP Request logging
app.use(logger('dev'));

// SECURE: Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const username = req.session && req.session.username ? req.session.username : 'Anonymous';
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - User: ${username} - IP: ${req.ip}`;

    if (res.statusCode >= 400) {
      winston.warn(logMessage);
    } else {
      winston.http(logMessage);
    }
  });

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// SECURE: CSRF Protection with csurf
const csrfProtection = csrf({ cookie: true });

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Return JSON error for API
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
