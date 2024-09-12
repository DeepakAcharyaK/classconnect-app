const express = require('express');
const router = express.Router();
const Teacher = require('../models/teacher.model.js');
const isTeacher = require('../middlewares/isTeacher.js');
const Admin = require('../models/admin.model.js');
const { validationRules, handleValidationErrors } = require('../utils/validationUtils.js');
const upload = require('../middlewares/multer.js');
const uploadToCloudinary = require('../middlewares/uploadToCloudinary.js');


// -----------------------------Teacher-Register---------------------------
router.get('/register', (req, res) => {
  res.render('teacher/teacherRegister', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
});
router.post('/register', validationRules.loginTeacher, handleValidationErrors, async (req, res) => {
  const { uid, name, email, phone, password } = req.body;
  try {
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.render('teacher/teacherRegister', { 
        errorMessage:'user already exist',
        successMessage: null 
      });
    }

    await Teacher.create({ uid, name, phone, password, email });
    res.render('teacher/teacherLogin', { 
      successMessage: 'Registration successful!',
      errorMessage: null 
    });

  } catch (err) {
    res.status(500).render('teacher/teacherRegister', { 
      errorMessage: 'An error occurred. Please try again.',
      successMessage: null 
    });
  }
});

// -----------------------------Teacher-Login---------------------------

router.get('/login', (req, res) => {
  res.render('teacher/teacherLogin', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
});

router.post('/login',validationRules.loginTeacher, handleValidationErrors, async (req, res) => {
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

    req.session.isTeacher = true; 
    req.session.teacherid = teacher._id; 
    res.redirect(`/teacher/teacherHome/${req.session.teacherid}`); 

  } catch (err) {
    req.flash('errorMessage', 'An error occurred during login.');
    res.status(500).redirect('/teacher/login');
  }
});

// -----------------------------Teacher-Home---------------------------

router.get('/teacherHome/:teacherid', isTeacher, async(req, res) => {
  try{
    const teacher=await Teacher.findOne({_id:req.params.teacherid})
    res.render('teacher/teacherHome',{
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage'),
      teacher
    });
  }catch{
    console.log('something went wrong')
  }
});

// -----------------------------Teacher-update---------------------------
router.post(
  '/:teacherid/profile/update',
  isTeacher,
  upload.single('profileimg'), // Handle single file upload named 'profileimg'
  uploadToCloudinary, // Upload to Cloudinary middleware
  validationRules.updateTeacher,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { teacherid } = req.params;
      const { name, phone, email } = req.body;

      // Find the teacher by ID and update basic details
      const updatedTeacher = await Teacher.findByIdAndUpdate(
        teacherid,
        {
          name,
          phone,
          email,
        },
        { new: true } // Return the updated document
      );

      // If a new file was uploaded and Cloudinary URL is available, update profile image
      if (req.file && req.file.cloudinaryUrl) {
        const profileImageUrl = req.file.cloudinaryUrl.url;
        updatedTeacher.profileimg = profileImageUrl;
        await updatedTeacher.save();
      }

      res.status(200).json({ message: 'Profile updated successfully', teacher: updatedTeacher });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error updating profile');
    }
  }
);


  
// -----------------------------Teacher-Logout---------------------------

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










