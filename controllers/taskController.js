const mongoose = require('mongoose');
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

		// If not admin, only show tasks created by or assigned to the user
		if (!req.user.isAdmin) {
			query.$or = [
				{ createdBy: req.user.id },
				{ assignedTo: req.user.id }
			];
		}

		if (search) {
			const searchQuery = {
				$or: [
					{ title: { $regex: search, $options: 'i' } },
					{ description: { $regex: search, $options: 'i' } }
				]
			};
			// Combine search with existing query
			query = query.$or ? 
				{ $and: [query, searchQuery] } : 
				searchQuery;
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
		const { title, dueDate, assignedTo } = req.body;

		if (!title || !dueDate) {
			return next(new ErrorHandler(400, 'Title and dueDate are required fields'));
		}

		if (!isValidDate(dueDate)) {
			return next(new ErrorHandler(400, 'Invalid dueDate. Please provide a valid date in the format YYYY-MM-DD'));
		}

		if (assignedTo) {
			const user = await User.findById(assignedTo);
			if (!user) {
				return next(new ErrorHandler(404, 'Assigned user not found'));
			}
		}

		const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);

		const newTask = new Task({
			...req.body,
			attachment: req.file && req.file.path,
			createdBy: userIdObjectId,
			assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : userIdObjectId,
		});

		const task = await newTask.save();

		// Send email to assigned user if assigned user is not the creator
		if (!task.assignedTo.equals(userIdObjectId)) {
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

		if (title) task.title = title;
		if (description) task.description = description;
		if (dueDate) task.dueDate = dueDate;
		if (priority) task.priority = priority;
		
		let notifyAssignedUser = false;
		let notifyCompleted = false;

		const assignedToObjectId = new mongoose.Types.ObjectId(assignedTo);

		// Check if assignedTo changed
		if (assignedTo && !task.assignedTo.equals(assignedToObjectId)) {
			const user = await User.findById(assignedTo);
			if (!user) {
				return next(new ErrorHandler(404, 'Assigned user not found'));
			}
			task.assignedTo = assignedToObjectId;
			notifyAssignedUser = true;
		}

		// Check if status changed
		if (status && status !== task.status) {
			task.status = status;
			if (status === 'Completed') {
				notifyCompleted = true;
			}
		}

		if (req.file) {
			task.attachment = req.file.path;
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
		console.error(error);
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
