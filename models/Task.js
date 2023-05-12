const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: String,
	dueDate: Date,
	status: {
		type: String,
		enum: ['Not Started', 'In Progress', 'Completed'],
		default: 'Not Started',
	},
	priority: {
		type: String,
		enum: ['Low', 'Medium', 'High'],
		default: 'Low',
	},
	assignedTo: {
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'User',
		required: false
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	}
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
