const { check, validationResult } = require('express-validator');

// Validation rules for different forms
const validationRules = {
  registerTeacher: [
    check('uid')
      .notEmpty()
      .withMessage('UID is required.')
      .isAlphanumeric()
      .withMessage('UID must contain only letters and numbers.'),
    check('name')
      .notEmpty()
      .withMessage('Full Name is required.')
      .isLength({ min: 3 })
      .withMessage('Full Name must be at least 3 characters long.'),
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email address.'),
    check('phone')
      .notEmpty()
      .withMessage('Mobile Number is required.')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please enter a valid phone number.'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    check('terms')
      .equals('on')
      .withMessage('You must accept the Terms and Conditions.'),
  ],
  loginTeacher: [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email address.'),
    check('password')
      .isLength({ min: 1 })
      .withMessage('Password must be at least 6 characters long.'),
  ],
  updateTeacher: [
    check('name').notEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Please provide a valid email'),
    check('phone').isMobilePhone().withMessage('Please provide a valid phone number')
  ]
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    req.flash('errorMessage', errorMessages.join(', '));
    return res.redirect(req.originalUrl); // Redirect to the original URL
  }
  next();
};

module.exports = { validationRules, handleValidationErrors };
