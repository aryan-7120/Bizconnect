/**
 * Utility: Reusable Express-Validator Chains
 * Import and spread these into route definitions to avoid duplicate validation code.
 */

const { body, param, query } = require('express-validator');

/** Validate registration input */
const registerValidators = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

/** Validate login input */
const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/** Validate password change */
const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

/** Validate MongoDB ObjectId params */
const objectIdValidator = (paramName) =>
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`);

/** Validate appointment booking */
const bookAppointmentValidators = [
  body('businessId').isMongoId().withMessage('Invalid business ID'),
  body('serviceId').isMongoId().withMessage('Invalid service ID'),
  body('date').isISO8601().toDate().withMessage('Valid date is required'),
  body('timeSlot.start').matches(/^\d{2}:\d{2}$/).withMessage('timeSlot.start must be HH:mm'),
  body('timeSlot.end').matches(/^\d{2}:\d{2}$/).withMessage('timeSlot.end must be HH:mm'),
];

/** Validate review creation */
const reviewValidators = [
  body('businessId').isMongoId().withMessage('Invalid business ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().trim().isLength({ max: 1000 }).withMessage('Comment is required (max 1000 chars)'),
];

/** Validate service creation */
const serviceValidators = [
  body('name').notEmpty().trim().withMessage('Service name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
];

module.exports = {
  registerValidators,
  loginValidators,
  changePasswordValidators,
  objectIdValidator,
  bookAppointmentValidators,
  reviewValidators,
  serviceValidators,
};
