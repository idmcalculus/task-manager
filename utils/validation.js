const { check } = require('express-validator');

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
		.isMongoId()
		.withMessage('Assigned user ID is invalid')
		.escape(),
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
			if (!req.file) {
				return true;
			}
			const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
			const ext = path.extname(req.file.originalname).toLowerCase();
			return allowedExtensions.includes(ext);
		})
		.withMessage('Attachment is invalid'),
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

module.exports = {
	taskValidationRules,
	userValidationRules
};