const mongoose=require('mongoose')

const materialSchema=new mongoose.Schema({
        classroom:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Classroom'
        },
        teacheruploaded:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Teacher'
        },
        title: {
            type:String,
            required:true
        },
        description:{
            type:String,
        },
        attachedFile: [String]
},{
    timestamps:true
})

module.exports=mongoose.model('Material',materialSchema)

