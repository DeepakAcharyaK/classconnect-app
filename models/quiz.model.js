const mongoose=require('mongoose')

const QuizSchema = new mongoose.Schema({
  questions: [
    {
      question: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctAnswer: { type: Number, required: true },  // Store the correct option index
      time: { type: Number, required: true },  // Time to answer in seconds
      score: { type: Number, required: true },  // Score for this question
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true }
},{
  timestamps:true
});

module.exports=mongoose.model('Quiz',QuizSchema)