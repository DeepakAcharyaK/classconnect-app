const mongoose=require('mongoose')

const studentSchema=new mongoose.Schema({
    usn:{ 
      type:String, 
      unique:true,
      required:true 
    },
    name:{ 
      type:String, 
      minLength: 1,
      required:true 
    },
    email:{ 
      type:String, 
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      unique: true,
      required:true
    },
    phone:{ 
      type:Number,  
      pattern: "^[0-9]{10}$",
      required:true 
    },
    password:{ 
      type:String, 
      required:true 
    },
    classroomerolled:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Classroom'
      }
    ],
    quiztaken:[
      {
          type:mongoose.Schema.Types.ObjectId,
          ref:'Quiz'
          // "score": Number, // Score obtained in the quiz
          // "taken_at": Date // Timestamp of when the quiz was taken
      }
    ] ,
    profileimg:{
      type: String,
      default:'https://res.cloudinary.com/dtfz2ftmr/image/upload/v1725025681/vifb0hlupt5ybcmimmi3.png',
    }
},{
  timestamps:true
})

module.exports=mongoose.model('Student',studentSchema)
  