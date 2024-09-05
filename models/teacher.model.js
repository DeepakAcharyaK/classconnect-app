const mongoose=require('mongoose')

const teacherSchema=new mongoose.Schema({
    uid:{ 
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
    isApproved:{
       type: Boolean,
       default: false 
    },
    classroomcreated:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Classroom'
      }
    ],
    quizcreated:[
      {
          type:mongoose.Schema.Types.ObjectId,
          ref:'Quiz'
      }
    ] ,
    profile:{
      type:String
    }
},{
  timestamps:true
})

module.exports=mongoose.model('Teacher',teacherSchema)
  