const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
  },
  createdteacher: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Teacher'
  },
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
