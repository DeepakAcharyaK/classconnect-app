const express = require('express');
const router = express.Router();
const Teacher = require('../models/teacher.model');
const isTeacher = require('../middlewares/isTeacher');
const Admin = require('../models/admin.model');

// Teacher registration route
router.get('/register', (req, res) => {
  res.render('teacher/teacherRegister', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage'),
  });
});

router.post('/register', async (req, res) => {
  const { uid, name, phone, password, email } = req.body;
  try {
    await Teacher.create({ uid, name, phone, password, email });
    req.flash('successMessage', 'Registration Successful...');
    res.redirect('/teacher/login');
  } catch (err) {
    req.flash('errorMessage', 'Error in Registering!!!');
    res.status(500).redirect('/teacher/register');
  }
});

// Teacher login route
router.get('/login', (req, res) => {
  res.render('teacher/teacherLogin', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage'),
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      req.flash('errorMessage', 'Teacher not found');
      return res.redirect('/teacher/login');
    }

    if (!teacher.isApproved) {
      req.flash('errorMessage', 'Your registration is pending approval');
      return res.redirect('/teacher/login');
    }

    if (teacher.password !== password) {
      req.flash('errorMessage', 'Incorrect email or password');
      return res.redirect('/teacher/login');
    }

    // Login successful
    req.session.isTeacher = true; // Mark the user as logged in
    req.session.teacher = teacher; // Store teacher data in the session
    res.redirect(`/teacher/teacherHome/${teacher._id}`); // Redirect to teacher home if approved
  } catch (err) {
    req.flash('errorMessage', 'An error occurred during login.');
    res.status(500).redirect('/teacher/login');
  }
});

// Teacher home page
router.get('/teacherHome/:id', isTeacher, (req, res) => {
  res.render('teacher/teacherHome');
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
      req.flash('errorMessage', 'Error logging out. Please try again.');
      return res.redirect('/teacher/teacherHome'); // Redirect back to home on error
    }
    res.redirect('/teacher/login'); // Redirect to login page after logout
  });
});

module.exports = router;










