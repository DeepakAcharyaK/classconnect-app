const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',  // Dynamically reference 'Student', 'Teacher', or 'Admin'
    required: true,
  },
  createdByModel: {
    type: String,
    enum: ['Student', 'Teacher', 'Admin'],  // Specifies which model the createdBy field refers to
    required: true,
  },
  context: {
    type: String,
    enum: ['classroom', 'teacher', 'admin', 'student'],  // Specifies the context of the comment
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
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
