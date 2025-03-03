const { check } = require('express-validator');
const path = require('path');

const taskValidationRules = [
	check('title')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Title is required')
		.escape(),
	check('description')
		.optional()
		.trim()
		.escape(),
	check('status')
		.optional()
		.trim()
		.escape(),
	check('assignedTo')
		.optional()
		.custom(value => {
			// Allow null, undefined, or empty string values
			if (value === null || value === undefined || value === '') {
				return true;
			}
			// Otherwise check if it's a valid MongoDB ObjectId
			return /^[0-9a-fA-F]{24}$/.test(value);
		})
		.withMessage('Assigned user ID is invalid'),
	check('dueDate')
		.optional()
		.escape(),
	check('priority')
		.optional()
		.isIn(['Low', 'Medium', 'High'])
		.withMessage('Priority is invalid')
		.escape(),
	check('attachment')
		.optional()
		.custom((value, { req }) => {
			// If no file is uploaded, validation passes
			if (!req.file) {
				return true;
			}
			// Define allowed file extensions
			const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
			// Get the extension from the original filename
			const ext = path.extname(req.file.originalname).toLowerCase();
			// Check if the extension is in the allowed list
			return allowedExtensions.includes(ext);
		})
		.withMessage('Attachment is invalid - only jpg, jpeg, png, gif, and pdf files are allowed'),
	check('createdBy')
		.isMongoId()
		.withMessage('Created by user ID is invalid')
		.escape(),
];

const userValidationRules = [
	check('username')
		.trim()
		.isLength({ min: 1 })
		.withMessage('Username is required')
		.escape(),
	check('email')
		.trim()
		.isEmail()
		.withMessage('Email is invalid'),
	check('password')
		.trim()
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters')
		.escape(),
];

// Separate validation rules for login that don't require username
const loginValidationRules = [
	check('email')
		.trim()
		.isEmail()
		.withMessage('Email is invalid'),
	check('password')
		.trim()
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters')
		.escape(),
];

module.exports = {
	taskValidationRules,
	userValidationRules,
	loginValidationRules
};