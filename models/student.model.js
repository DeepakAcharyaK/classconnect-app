const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    usn: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: Number,  
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    classroomerolled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classroom'
        }
    ],
    quiztaken: [
        {
            quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
            marks: { type: Number },
            isTaken:{
                type:Boolean,
                default:false
            }
        }
    ],
    materialsuploaded: [
        {
            attachedFile: [{ type: String }],
            description: { type: String },
            materialId: { 
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Material'
            }  
        }
    ],
    messages: [
        {
            content: { type: String, required: true }, // Message content
            sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // Reference to the teacher
            timestamp: { type: Date, default: Date.now } // Timestamp of the message
        }
    ],
    profileimg: {
        type: String,
        default: 'https://res.cloudinary.com/dtfz2ftmr/image/upload/v1725025681/vifb0hlupt5ybcmimmi3.png'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);

