const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Ensuring that the title is required
  },
  content: {
    type: String,
    required: true, // Ensuring that the content is required
  },
  createdby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  attachedFile: [String], 
  coverImage: {
    type: String, // Stores the path or URL of the cover image
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets the creation date
  },
});

module.exports = mongoose.model('Notice', noticeSchema);