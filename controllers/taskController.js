const Task = require('../models/Task');
const User = require('../models/User');
const { ErrorHandler } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const { isValidDate } = require('../utils/isValidDate');

const ITEMS_PER_PAGE = 5;

exports.getTasks = async (req, res, next) => {
	try {
		let { page, search, status, priority } = req.query;

		page = page ? Number(page) : 1;
		const skip = (page - 1) * ITEMS_PER_PAGE;

		let query = {};

		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}

		if (status) {
			query.status = status;
		}

		if (priority) {
			query.priority = priority;
		}

		const tasks = await Task.find(query)
			.populate([
				{ path: 'assignedTo', select: 'username email' },
				{ path: 'createdBy', select: 'username email' },
			])
			.skip(skip)
			.limit(ITEMS_PER_PAGE);

		const totalDocuments = await Task.countDocuments();

		res.status(200).send({
			tasks,
			currentPage: page,
			totalPages: Math.ceil(totalDocuments / ITEMS_PER_PAGE),
		});
	} catch (error) {
		return next(new ErrorHandler(500, 'Failed to retrieve tasks'));
	}
};

exports.getTaskById = async (req, res, next) => {
	try {
		const task = await Task.findById(req.params.id)
			.populate([
				{ path: 'assignedTo', select: 'username email' },
				{ path: 'createdBy', select: 'username email' },
			]);

		if (!task) {
			return next(new ErrorHandler(404, 'Task not found'));
		}

		res.status(200).send(task);
	} catch (error) {
		return next(new ErrorHandler(500, 'Failed to retrieve task'));
	}
};

exports.createTask = async (req, res, next) => {
	try {
		const { title, dueDate } = req.body;

		if (!title || !dueDate) {
			return next(new ErrorHandler(400, 'Title and dueDate are required fields'));
		}

		if (!isValidDate(dueDate)) {
			return next(new ErrorHandler(400, 'Invalid dueDate. Please provide a valid date in the format YYYY-MM-DD'));
		}

		const newTask = new Task({
			...req.body,
			attachment: req.file && req.file.path,
		});

		const task = await newTask.save();

		// Send email to assigned user if task is assigned
		if (task.assignedTo) {
			const user = await User.findById(task.assignedTo);
			await sendEmail(
				user.email,
				'New Task Assigned',
				`Dear ${user.username},\n\nA new task titled "${task.title}" has been assigned to you.
				\n\nPlease login to your account to view the task details.\n\nRegards,\nTask Manager`,
			);
		}

		res.status(201).json(newTask);
	} catch (error) {
		console.error(error);
		return next(new ErrorHandler(500, 'Failed to create task'));
	}
};

exports.updateTask = async (req, res, next) => {
	try {
		const task = await Task.findByIdAndUpdate(req.params.id);
		
		if (!task) {
			return next(new ErrorHandler(404, 'Task not found'));
		}

		const { title, description, dueDate, priority, assignedTo, status } = req.body;

		const updatedTask = {
			title,
			description,
			dueDate,
			priority,
			assignedTo,
			status,
		};

		if (req.file) {
			updatedTask.attachment = req.file.path;
		}
		
		let notifyAssignedUser = false;
		let notifyCompleted = false;

		if (assignedTo && assignedTo !== task.assignedTo.toString()) {
			task.assignedTo = assignedTo;
			notifyAssignedUser = true;
		}

		if (status && status !== task.status) {
			task.status = status;
			if (status === 'Completed') {
				notifyCompleted = true;
			}
		}

		await task.save();

		if (notifyAssignedUser) {
			const user = await User.findById(task.assignedTo);
			await sendEmail(
				user.email,
				'Task Assigned',
				`Dear ${user.username},\n\nA new task titled "${task.title}" has been assigned to you.
				\n\nPlease login to your account to view the task details.\n\nRegards,\nTask Manager`,
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
		return next(new ErrorHandler(500, 'Failed to update task'));
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
		return next(new ErrorHandler(500, 'Failed to delete task'));
	}
};
