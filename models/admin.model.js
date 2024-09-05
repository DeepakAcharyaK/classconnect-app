const mongoose=require('mongoose')

const hodSchema=new mongoose.Schema({
    name:{ 
        type:String, 
        minLength: 1,
        required:true 
    },
    email:{ 
        type:String, 
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        unique: true,
    },
    password:{ 
        type:String, 
        required:true 
    },
    profileimg:{
        type:String,
        default:'https://res.cloudinary.com/dtfz2ftmr/image/upload/v1725025681/vifb0hlupt5ybcmimmi3.png'
    },
    teacher:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Teacher'
        }
    ],
    student:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Student'
        }
    ]
},{
    timestamps:true
})

module.exports=mongoose.model("Admin",hodSchema)