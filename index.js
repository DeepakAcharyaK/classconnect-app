const express= require('express')
const app=express()
const { connectDB }=require('./DB/dbconnection.js')
const landPageRoutes=require('./routes/index.routes.js')
const teacherRoutes=require('./routes/teacher.routes.js')
const studentRoutes=require('./routes/student.routes.js')
const adminRoutes=require('./routes/admin.routes.js')
// const { upload } = require('../middleware/multer.js');
// const { cloudinary } = require('../middleware/cloudinary.js');
const session = require('express-session');
const flash = require('connect-flash');
const path =require('path')
// Session middleware
app.use(session({
    secret: 'yourSecretKey', // Use a secure key in production
    resave: false,
    saveUninitialized: false,
    // cookie: { maxAge:110000 } // Set to true if using HTTPS
}));
  
 // Flash middleware
app.use(flash());
app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
// app.use(express.static('public'))
// app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

connectDB()

app.use('/',landPageRoutes)
app.use('/admin',adminRoutes)
app.use('/student',studentRoutes)
app.use('/teacher',teacherRoutes)

app.listen(process.env.PORT || 5500,()=>{
    console.log('Server is running on port',process.env.PORT )
})