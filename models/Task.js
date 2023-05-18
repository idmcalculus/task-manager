const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: false },
	dueDate: { type: Date, required: true },
	status: {
		type: String,
		required: false,
		enum: ['Not Started', 'In Progress', 'Completed'],
		default: 'Not Started',
	},
	priority: {
		type: String,
		required: false,
		enum: ['Low', 'Medium', 'High'],
		default: 'Low',
	},
	assignedTo: {
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User',
		required: false,
		set: value => (value === '' ? undefined : value)
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	attachment: { type: String, required: false },
}, { collection: 'tasks', timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
