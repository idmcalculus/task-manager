const Task = require('../models/Task');
const User = require('../models/User');
const { ErrorHandler } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');

exports.getTasks = async (req, res, next) => {
	try {
		const tasks = Task.find({}).populate('assignedTo', 'username email');
		res.status(200).json(tasks);
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to retrieve tasks'));
	}
};

exports.createTask = async (req, res, next) => {
	try {
		const newTask = new Task(req.body);
		const task = await newTask.save();

		// Send email to assigned user if task is assigned
		if (task.assignedTo) {
			const user = await User.findById(task.assignedTo);
			await sendEmail(
				user.email,
				'New Task Assigned',
				`Dear ${user.username},\n\nA new task titled "${task.title}" has been assigned to you.`,
			);
		}
		res.status(201).json(newTask);
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to create task'));
	}
};

exports.updateTask = async (req, res, next) => {
	try {
		const task = await Task.findByIdAndUpdate(req.params.id);
		
		if (!task) {
			return next(new ErrorHandler(404, 'Task not found'));
		}

		const { assignedTo, status } = req.body;
		let notifyAssignedUser = false;
		let notifyCompleted = false;

		if (assignedTo && assignedTo !== task.assignedTo.toString()) {
			task.assignedTo = assignedTo;
			notifyAssignedUser = true;
		}

		if (status && status !== task.status) {
			task.status = status;
			if (status === 'completed') {
				notifyCompleted = true;
			}
		}

		await task.save();

		if (notifyAssignedUser) {
			const user = await User.findById(task.assignedTo);
			await sendEmail(
				user.email,
				'Task Assigned',
				`Dear ${user.username},\n\nA task titled "${task.title}" has been assigned to you.`,
			);
		}

		if (notifyCompleted) {
			const user = await User.findById(task.assignedTo);
			await sendEmail(
				user.email,
				'Task Completed',
				`Dear ${user.username},\n\nA task titled "${task.title}" has been marked as completed.`,
			);
		}

		res.status(202).json(task);
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to update task'));
	}
};

exports.deleteTask = async (req, res, next) => {
	try {
		const task = await Task.findByIdAndDelete(req.params.id);
		if (!task) {
			return next(new ErrorHandler(404, 'Task not found'));
		}
		res.status(202).json({ message: 'Task deleted successfully' });
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to delete task'));
	}
};
