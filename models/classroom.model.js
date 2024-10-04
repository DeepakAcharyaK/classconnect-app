const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
  },
  coverImage: {
    type: String,
    default:'https://img.freepik.com/premium-vector/education-school-pattern-design_260839-1.jpg?w=996'
  },
  code: {
    type: String,
    required: true,
  },
  createdteacher: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Teacher'
  },
  announcementby:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Teacher'
      }
    ],
  studentsenrolled: [
    {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Student'
        // "joined_at": Date // Timestamp of when the student joined the class
    }
  ],
  materialsavailable: [
    {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Material'
        // "uploaded_at": Date // Timestamp of when the material was uploaded
    }
  ],
  quizcreated:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
        // "created_at": Date // Timestamp of when the quiz was created
    }
  ]
},{
    timestamps:true
});

module.exports = mongoose.model('Classroom', classroomSchema);