const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME } = require('../utils/token');

const extractToken = (req) => {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
};

// Authentication: verifies JWT and loads a fresh user from the DB on every request.
const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();

  const decoded = jwt.verify(token, env.jwtSecret); // throws -> mapped to 401
  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');
  if (user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000) > decoded.iat) {
    throw ApiError.unauthorized('Password was changed. Please log in again');
  }
  req.user = user;
  next();
});

// Authorization (RBAC): authorize(ROLES.SUPER_ADMIN, ROLES.MUNICIPAL_OFFICER)
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

module.exports = { protect, authorize };
