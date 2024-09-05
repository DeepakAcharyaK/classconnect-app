const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdteacher: {
     type: Schema.Types.ObjectId,
     ref: 'Teacher'
  },
  studentsenrolled: [
    {
        type: Schema.Types.ObjectId,
        ref: 'Student'
        // "joined_at": Date // Timestamp of when the student joined the class
    }
  ],
  materialsavailable: [
    {
        type: Schema.Types.ObjectId,
        ref: 'Material'
        // "uploaded_at": Date // Timestamp of when the material was uploaded
    }
  ],
  quizcreated:[
    {
        type: Schema.Types.ObjectId,
        ref: 'Quiz'
        // "created_at": Date // Timestamp of when the quiz was created
    }
  ]
},{
    timestamps:true
});

module.exports = mongoose.model('Classroom', classroomSchema);
