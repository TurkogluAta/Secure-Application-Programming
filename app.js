var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var apiRouter = require('./routes/api');

var app = express();

// VULNERABILITY 3: SENSITIVE DATA EXPOSURE via HTTP Headers
// Insecure headers that expose server information
app.use((req, res, next) => {
  // INSECURE: Exposes server technology and version
  res.setHeader('X-Powered-By', 'Express 4.16.1');
  res.setHeader('Server', 'Node.js/v18.0.0 (Ubuntu)');

  // INSECURE: Reveals internal application details
  res.setHeader('X-App-Version', '1.0.0-insecure');
  res.setHeader('X-Database', 'SQLite3');
  res.setHeader('X-Environment', 'development');

  // INSECURE: Discloses internal server paths
  res.setHeader('X-Server-Root', __dirname);

  // INSECURE: Expose all headers to JavaScript (makes them readable via fetch API)
  res.setHeader('Access-Control-Expose-Headers', 'X-Powered-By, Server, X-App-Version, X-Database, X-Environment, X-Server-Root');

  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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
