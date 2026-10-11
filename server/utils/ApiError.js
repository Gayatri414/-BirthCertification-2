class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(msg, errors) { return new ApiError(400, msg, errors); }
  static unauthorized(msg = 'Authentication required') { return new ApiError(401, msg); }
  static forbidden(msg = 'You do not have permission to perform this action') { return new ApiError(403, msg); }
  static notFound(msg = 'Resource not found') { return new ApiError(404, msg); }
  static conflict(msg, errors) { return new ApiError(409, msg, errors); }
  static validation(errors, msg = 'Validation failed') { return new ApiError(422, msg, errors); }
}
module.exports = ApiError;
