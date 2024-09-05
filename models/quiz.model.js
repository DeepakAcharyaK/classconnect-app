const mongoose=require('mongoose')

const quizSchema=new mongoose.Schema({
        classroomfrom:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Classroom'
        },
        createdby: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'createdbyModel'  // Dynamically references the model specified in 'createdbyModel'
        },
        createdbyModel: {
            type: String,
            required: true,
            enum: ['Teacher', 'Placementofficer']  // Restricts to the allowed model names
        },
        title:{
            type:String
        },
        description:{
            type:String
        },
        questions:[
          {
            // question_id: ObjectId(...),
            questiontext: String,
            options: [
              {
                optiontext: String,
                iscorrect: Boolean
              }
            ],
            createdat: Date,
            updatedat: Date
          }
        ],
        duration: {
            type:Number
        },
        totalmarks:{
            type:Number
        } 
},{
    timestamps:true
})

module.exports=mongoose.model('Quiz',quizSchema)