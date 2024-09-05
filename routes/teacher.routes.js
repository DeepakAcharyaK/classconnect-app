const express= require('express')
const router=express.Router()
const Teacher = require('../models/teacher.model');
const Admin = require('../models/admin.model');

//isteacher
const isTeacher = (req, res, next) => {
  if (req.session.isAdmin) {
    console.log(req.session)
    next();
  } else {
    res.redirect('/admin/login'); // Redirect to HOD login if not authenticated
  }
};

//register
router.get('/register',(req,res)=>{
    res.render('teacher/teacherRegister')
})

// Teacher registration route
router.post('/register', async (req, res) => {
  const { uid,name,phone,password, email } = req.body;

  try {
    // Create new teacher
    const newTeacher = await Teacher.create({ uid,name,phone,password,email });
    res.redirect('/teacher/login')
    //res.render('register-success'); // Render registration success page
  } catch (err) {
    res.status(500).send('Error registering teacher');
  }
});

// Teacher login
router.get('/login', (req, res) => {
  res.render('teacher/teacherLogin', { message: null }); // Initialize message as null
});


// Teacher login route
router.post('/login', async (req, res) => {
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

    res.redirect(`/teacher/teacherHome/${teacher._id}`); // Redirect to teacher home if approved
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

router.get('/teacherHome/:id',(req,res)=>{
  res.render('teacher/teacherHome')
})


module.exports = router;










