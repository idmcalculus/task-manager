const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middleware/errorHandler');
const Task = require('../models/Task');

exports.authorize = (req, res, next) => {
	try {
		// Check session first
		if (req.session && req.session.user) {
			req.user = req.session.user;
			return next();
		}

		// Then check JWT token
		const bearerHeader = req.headers['authorization'] || req.header('Authorization');
		if (!bearerHeader) {
			return next(new ErrorHandler(401, 'Authentication required'));
		}

		const token = bearerHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded.user;
		next();
	} catch (error) {
		return next(new ErrorHandler(401, 'Invalid authentication'));
	}
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
	if (!req.user || !req.user.isAdmin) {
		return next(new ErrorHandler(403, 'Admin access required'));
	}
	next();
};

// Middleware to ensure user can only access their own tasks
exports.canAccessTask = async (req, res, next) => {
	try {
		// Admin can access all tasks
		if (req.user.isAdmin) {
			return next();
		}

		// For task creation, user is already authenticated
		if (req.method === 'POST') {
			return next();
		}

		// For other operations, check if user owns the task or is assigned to it
		const taskId = req.params.id;
		if (!taskId) {
			// For GET /tasks, filter in the controller
			return next();
		}

		const task = await Task.findById(taskId);
		if (!task) {
			return next(new ErrorHandler(404, 'Task not found'));
		}

		if (task.createdBy.toString() === req.user.id || 
			(task.assignedTo && task.assignedTo.toString() === req.user.id)) {
			return next();
		}

		return next(new ErrorHandler(403, 'Not authorized to access this task'));
	} catch (error) {
		return next(new ErrorHandler(500, 'Error checking task access'));
	}
};
