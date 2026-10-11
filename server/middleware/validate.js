const ApiError = require('../utils/ApiError');

// Usage: validate(zodSchema, 'body' | 'query' | 'params')
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(ApiError.validation(errors));
  }
  req[source] = result.data;
  next();
};
