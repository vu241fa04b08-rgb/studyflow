const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error in development
  if (process.env.NODE_ENV !== 'test') {
    console.error('ErrorHandler Caught:', err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    return errorResponse(res, 404, message);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return errorResponse(res, 409, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return errorResponse(res, 400, 'Validation Error', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Authentication token expired');
  }

  return errorResponse(
    res,
    error.statusCode || 500,
    error.message || 'Internal Server Error',
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
};

module.exports = errorHandler;
