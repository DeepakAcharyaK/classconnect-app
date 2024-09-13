const express = require('express');
const router = express.Router();
const Teacher = require('../models/teacher.model.js');
const Classrooms = require('../models/classroom.model.js');
const Notice = require('../models/notice.model.js');
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

router.get('/teacherHome/:teacherid', isTeacher, async (req, res) => {
  try {
    // Find the teacher by ID and populate the 'classroomcreated' field
    const teacher = await Teacher.findOne({ _id: req.params.teacherid }).populate('classroomcreated');
    // console.log(teacher)
    res.render('teacher/teacherHome', {
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage'),
      teacher,
    });
  } catch (error) {
    console.log('Something went wrong:', error); // Log the error for debugging
    req.flash('errorMessage', 'An error occurred while loading the page.');
    res.status(500).redirect('/error'); // Optionally redirect to an error page
  }
});

// -----------------------------Teacher-update-profile---------------------------

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
      req.flash('successMessage', 'Profile updated successfully')
      res.status(200).redirect(`/teacher/teacherHome/${updatedTeacher._id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send('Error updating profile');
    }
  }
);  
//-----------------------------create-class----------------------------------

router.post('/teacherHome/:teacherid/classroom/create', isTeacher, async (req, res) => {
  const { teacherid } = req.params; // Extract the teacher ID from the URL
  const { className, classCode } = req.body; // Extract the className and classCode from the form data

  try {
    // Create a new classroom document
    const newClassroom = await Classrooms.create({
      name: className,
      code: classCode,
      createdteacher: teacherid // Reference to the teacher
    });

    // Find the teacher and update their created classrooms
    const teacher = await Teacher.findById(teacherid);

    if (teacher) {
      // Push the new classroom to the teacher's classroomcreated array
      teacher.classroomcreated.push(newClassroom._id); // Assuming classroomcreated stores IDs
      await teacher.save(); // Await the save operation

      // Flash a success message and redirect to the teacher's home page
      req.flash('successMessage', 'Classroom created successfully.');
      res.redirect(`/teacher/teacherHome/${teacherid}`);
    } else {
      // If the teacher is not found, handle the error
      req.flash('errorMessage', 'Teacher not found.');
      res.status(404).redirect(`/teacher/teacherHome/${teacherid}`);
    }
  } catch (error) {
    console.error('Error creating classroom:', error); // Log the error for debugging
    req.flash('errorMessage', 'Internal Server Error.');
    res.status(500).redirect(`/teacher/teacherHome/${teacherid}`);
  }
});
//------------------------------announcement-----------------------------
router.post('/teacherHome/:teacherid/announcements/create', isTeacher, async (req, res) => {
  const { teacherid } = req.params; // Extract the teacher ID from the URL
  const { announcementTitle, announcementBody } = req.body; // Extract the className and classCode from the form data

  try {
    // Create a new classroom document
    const newAnnouncement = await Notice.create({
      title: announcementTitle,
      content: announcementBody,
      createdby: teacherid // Reference to the teacher
    });

    // Find the teacher and update their created classrooms
    const teacher = await Teacher.findById(teacherid);

    if (teacher) {
      // Push the new classroom to the teacher's classroomcreated array
      teacher.announcement.push(newAnnouncement._id); // Assuming classroomcreated stores IDs
      await teacher.save(); // Await the save operation

      // Flash a success message and redirect to the teacher's home page
      req.flash('successMessage', 'Announcement announced successfully.');
      res.redirect(`/teacher/teacherHome/${teacherid}`);
    } else {
      // If the teacher is not found, handle the error
      req.flash('errorMessage', 'Something went wrong.');
      res.status(404).redirect(`/teacher/teacherHome/${teacherid}`);
    }
  } catch (error) {
    console.error('Error creating classroom:', error); // Log the error for debugging
    req.flash('errorMessage', 'Internal Server Error.');
    res.status(500).redirect(`/teacher/teacherHome/${teacherid}`);
  }
})
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
