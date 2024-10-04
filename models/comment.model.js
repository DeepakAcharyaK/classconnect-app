const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // Assuming comments are created by students
    required: true,
  },
  context: {
    type: String,
    enum: ['classroom', 'teacher', 'admin'],  // Specifies the context type
    required: true,
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);

