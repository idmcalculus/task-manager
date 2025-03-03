const { validationResult } = require('express-validator');
const { ErrorHandler } = require('./errorHandler');

/**
 * Middleware to check validation results from express-validator
 * Should be used after validation rules are applied
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new ErrorHandler(400, errorMessages.join(', ')));
  }
  next();
};

module.exports = {
  validateRequest
};
