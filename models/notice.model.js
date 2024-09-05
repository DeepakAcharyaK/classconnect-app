const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: String,
  createdby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'createdbyModel'  // Dynamically references the model specified in 'createdbyModel'
  },
  createdbyModel: {
    type: String,
    required: true,
    enum: ['Teacher', 'Placementofficer']  // Restricts to the allowed model names
  },
  classroom: {
    type: Schema.Types.ObjectId,
    ref: 'Classroom'
  }
});

module.exports = mongoose.model('Notice', noticeSchema);