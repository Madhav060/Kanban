const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  category: { type: String, enum: ['Work', 'Personal', 'Bug', 'Feature'], default: 'Work' },
  assignedTo: { type: String, required: true }, // ✅ made required
  status: { type: String, enum: ['To-Do', 'In-Progress', 'Done'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
