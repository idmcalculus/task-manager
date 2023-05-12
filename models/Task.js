const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  completed: { type: Boolean, default: false },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  },
});

module.exports = mongoose.model('Task', TaskSchema);
