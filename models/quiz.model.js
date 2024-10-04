const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: String,
  description: String,
  time: Number,  // Time to answer in seconds
  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: Number, required: true },  // Store the correct option index
      score: { type: Number, required: true },  // Score for this question
    },
  ],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Teacher', required: true
    },
  
  // Array to store the students who took the quiz and their marks
  studentsTaken: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      marksObtained: { type: Number, required: true },
    }
  ],

  // Field to track whether the quiz is open or closed
  isOpen: { type: Boolean, default: true } // True means the quiz is open, False means it's closed
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', QuizSchema);

