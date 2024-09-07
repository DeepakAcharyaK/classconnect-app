const express= require('express')
const router=express.Router()
const Teacher = require('../models/teacher.model');
const isTeacher=require('../middlewares/isTeacher')
const Admin = require('../models/admin.model');

//register
router.get('/register',(req,res)=>{
    res.render('teacher/teacherRegister')
})

// Teacher registration route
router.post('/register', async (req, res) => {
  const { uid,name,phone,password, email } = req.body;
  try {
    const newTeacher = await Teacher.create({ uid,name,phone,password,email }); // Create new teacher
    req.flash('successMessage','Registration Successfull...')
    res.redirect('/teacher/login')
  } catch (err) {
    req.flash('errorMessage','Error in Registering!!!')
    res.status(500).redirect('/teacher/register')
  }
});

// Teacher login
router.get('/login', (req, res) => {
  res.render('teacher/teacherLogin',{
     successMessage:req.flash('successMessage'),
     errorMessage:req.flash('errorMessage')
    }
   ); 
});

// Teacher login route
router.post('/login',async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.render('teacher/teacherLogin', { message: 'Teacher not found' });
    }

    if (!teacher.isApproved) {
      return res.render('teacher/teacherLogin', { message: 'Your registration is pending approval' });
    }

    if (teacher.password !== password) {
      return res.render('teacher/teacherLogin', { message: 'Incorrect password' });
    }
    req.session.isTeacher = true; // Mark the user as logged in
    req.session.teacher = teacher; // Store teacher ID in the session
    console.log(req.session)
    res.redirect(`/teacher/teacherHome/${teacher._id}`); // Redirect to teacher home if approved
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

//Teacher home page
router.get('/teacherHome/:id',isTeacher,(req,res)=>{
  res.render('teacher/teacherHome')
})

//logout
router.get('/logout',(req,res)=>{
  req.session.teacher
})


module.exports = router;










