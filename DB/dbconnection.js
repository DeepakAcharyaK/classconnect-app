const mongoose =require('mongoose')

const connectDB=()=>{
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
        console.log('DB connected successfully...')
    } catch (error) {
        console.log('something went wrong while connecting DB!!')
        console.log(error)
    }
}

module.exports= {connectDB}