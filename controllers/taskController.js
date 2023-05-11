const Task = require('../models/Task');
const { ErrorHandler } = require('../middleware/errorHandler');

exports.getTasks = async (req, res, next) => {
	try {
		const tasks = await Task.find();
		res.json(tasks);
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to retrieve tasks'));
	}
};

exports.createTask = async (req, res, next) => {
	try {
		const task = new Task(req.body);
		await task.save();
		res.status(201).json(task);
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to create task'));
	}
};

exports.updateTask = async (req, res, next) => {
	try {
		const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!task) {
			return next(new ErrorHandler(404, 'Task not found'));
		}
		res.json(task);
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
		res.json({ message: 'Task deleted successfully' });
	} catch (error) {
		next(new ErrorHandler(500, 'Failed to delete task'));
	}
};
