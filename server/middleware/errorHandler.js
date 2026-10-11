const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = 'Internal server error', errors = [] } = err;

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
    errors = [{ field, message }];
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'MulterError') {
    statusCode = 422;
    message = err.message;
  }

  if (statusCode >= 500) {
    console.error(`[${req.method}] ${req.originalUrl} ->`, env.nodeEnv === 'production' ? err.message : err);
    if (env.nodeEnv === 'production') message = 'Internal server error';
  }

  res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { notFound, errorHandler };
