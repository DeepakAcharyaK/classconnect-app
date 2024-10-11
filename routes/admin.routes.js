const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const router = express.Router();
const Teacher = require('../models/teacher.model.js');
const Student = require('../models/student.model.js');
const Classroom = require('../models/classroom.model.js');
const Quiz = require('../models/quiz.model.js');
const Notice = require('../models/notice.model.js');
const Material = require('../models/material.model.js');
const Admin = require('../models/admin.model.js'); 
const Comment = require('../models/comment.model.js'); 
const Gallery = require('../models/gallery.model.js');

const upload = require('../middlewares/upload.js');
const isAdmin=require('../middlewares/isAdmin.js')

// --------------REGISTER---------------------------✅
// HOD Registration Page
router.get('/register', (req, res) => {
  res.render('admin/adminRegister',{
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
});

router.post('/register', async (req, res) => {
  let { name, password, email } = req.body;

  // Input validation (optional but recommended)
  if (!name || !email || !password) {
    req.flash('errorMessage', 'All fields are required.');
    return res.redirect('/admin/register');
  }

  try {
    // Check if the email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      req.flash('errorMessage', 'Email is already in use.');
      return res.redirect('/admin/register');
    }

    // Generate salt and hash the password
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        console.error('Error generating salt:', err);
        req.flash('errorMessage', 'Something went wrong. Please try again.');
        return res.redirect('/admin/register');
      }

      bcrypt.hash(password, salt, async function(err, hash) {
        if (err) {
          console.error('Error hashing password:', err);
          req.flash('errorMessage', 'Something went wrong. Please try again.');
          return res.redirect('/admin/register');
        }

        try {
          // Create the admin in the database
          const createdAdmin = await Admin.create({
            name,
            email,
            password: hash
          });
          req.flash('successMessage', 'Admin registered successfully!');
          return res.redirect('/admin/login');
        } catch (error) {
          console.error('Error creating admin:', error);
          req.flash('errorMessage', 'Failed to register. Please try again.');
          return res.redirect('/admin/register');
        }
      });
    });
  } catch (error) {
    console.error('Error checking email:', error);
    req.flash('errorMessage', 'Something went wrong. Please try again.');
    return res.redirect('/admin/register');
  }
});

// -----------------LOGIN------------------------------✅

// HOD Login Page
router.get('/login', (req, res) => {
  res.render('admin/adminLogin',{
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
});

// Admin Login Route
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    // Find the admin by username
    const admin = await Admin.findOne({ name });

    // If admin does not exist
    if (!admin) {
      req.flash('errorMessage', 'Invalid credentials'); // Set failure message
      return res.redirect('/admin/login'); // Redirect back to login
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    
    // If passwords don't match
    if (!isMatch) {
      req.flash('errorMessage', 'Invalid credentials'); // Set failure message
      return res.redirect('/admin/login'); // Redirect back to login
    }

    // If credentials are correct, store session details
    req.session.isAdmin = true;
    req.session.admin = admin;

    req.flash('successMessage', 'Login successful!'); // Set success message
    res.redirect(`/admin/adminPanel/${admin._id}`); // Redirect to admin panel

  } catch (err) {
    console.error(err); // Log the error for debugging purposes
    req.flash('errorMessage', 'An error occurred while logging in. Please try again.'); // Set error message
    res.redirect('/admin/login'); // Redirect back to login
  }
});

// --------------------HOME---------------------------

// Admin Panel: View all users and teachers
router.get('/adminPanel/:id', isAdmin, async (req, res) => {
  try {
    const pendingTeachers = await Teacher.find({ isApproved: false });
    const approvedTeachers = await Teacher.find({ isApproved: true });
    
    const students = await Student.find({});
    // Pass the message from the session to the template
    const message = req.session.message;
    req.session.message = null; // Clear the message after passing it

    res.render('admin/adminPanel', {
      pendingTeachers,
      approvedTeachers,
      students,
      message // Pass the message to the template
    });
  } catch (err) {
    res.status(500).send('Error fetching data');
  }
});

// --------------------- TEACHER----------------

//render page
router.get('/teacher-manage',isAdmin,async(req, res) => {
  const pendingTeachers = await Teacher.find({ isApproved: false });
  const approvedTeachers = await Teacher.find({ isApproved: true });

  if(!pendingTeachers || !approvedTeachers) {
    console.log('No pendingTeachers or approvedTeachers')
  }

  res.render('admin/manageTeacher',{
      pendingTeachers,
      approvedTeachers,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage')
  });
})

//approve
router.post('/approve/teacher/:id', isAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log('Teacher not found')
      return res.status(404);
    }

    teacher.isApproved = true;
    await teacher.save();

    req.flash('successMessage','Successfully Approved')
    return res.redirect(`/admin/teacher-manage`);
  } catch (err) {
    console.log('Error in approval request', err);
    req.flash('errorMessage','Error in approval request')
    return res.status(500).res.redirect(`/admin/teacher-manage`);
  }
});

//reject
router.post('/reject/teacher/:id', isAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log('Teacher not found')
      return res.status(404)
    }

    await Teacher.deleteOne({ _id: req.params.id });

    req.flash('successMessage','Teacher rejected successfully')
    return res.redirect(`/admin/teacher-manage`);
  } catch (err) {
    console.log('Error in rejecting the teacher',err)
    req.flash('errorMessage','Error in rejecting')
    return res.status(500).redirect(`/admin/teacher-manage`);
  }
});

// delete
router.post('/delete/teacher/:id', isAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;

    // Find the teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log('Teacher not found');
      return res.redirect(`/admin/teacher-manage`);
    }

    // Delete associated classrooms
    await Classroom.deleteMany({ createdteacher: teacherId });

    // Delete associated comments
    await Comment.deleteMany({ createdBy: teacherId, createdByModel: 'Teacher' });

    // Delete associated materials
    await Material.deleteMany({ teacheruploaded: teacherId });

    // Delete associated notices
    await Notice.deleteMany({ createdby: teacherId });

    // Delete associated quizzes
    await Quiz.deleteMany({ createdBy: teacherId });

    // Finally, delete the teacher
    await Teacher.deleteOne({ _id: teacherId });

    req.flash('successMessage','Teacher deleted successfully')
    return res.redirect(`/admin/teacher-manage`);
  } catch (err) {
    console.error('Error deleting teacher:', err);
    req.flash('errorMessage','Error deleting teacher')
    return res.redirect(`/admin/teacher-manage`);
  }
});

// ----------------------STUDENT----------------------

//route to display the student
router.get('/student-manage',isAdmin,async(req, res) => {
  const students = await Student.find({});
  res.render('admin/manageStudent',{
      students,
      successMessage:req.flash('successMessage'),
      errorMessage:req.flash('errorMessage')
  });
})

// Route to delete the student
router.post('/delete/student/:id', isAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;

    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      req.session.message = 'Student not found';
      return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
    }

    // Remove the student from classrooms where they are enrolled
    await Classroom.updateMany(
      { studentsenrolled: studentId },
      { $pull: { studentsenrolled: studentId } }
    );

    // Remove the student from quizzes they have taken
    await Quiz.updateMany(
      { 'studentsTaken.student': studentId },
      { $pull: { studentsTaken: { student: studentId } } }
    );

    await Comment.deleteMany({ createdBy: studentId, createdByModel: 'Student' });

    // Delete the student from the Student collection
    await Student.deleteOne({ _id: studentId });

    // Flash success message and redirect
    req.flash('successMessage', 'Student removed');
    res.redirect(`/admin/student-manage`);
  } catch (err) {
    console.error(err);
    req.session.message = 'Error deleting student';
    return res.redirect(`/admin/student-manage`);
  }
});

// -----------------------GET DATA----------------

//route to render the get data page
router.get('/getData',isAdmin,(req,res)=>{
  res.render('admin/getData',{
    successMessage:req.flash('successMessage'),
    errorMessage:req.flash('errorMessage')
  })
})

//route to fetch the student details
router.get('/student/:usn',isAdmin, async (req, res) => {
  try {
    const student = await Student.findOne({ usn: req.params.usn })
      .populate('classroomerolled') // Populate classrooms
      .populate('quiztaken.quizId')  // Populate quizzes
      .populate('materialsuploaded.materialId'); // Populate materials

    if (!student) {
      console.log('Student not found');
      return res.status(404);
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student data' });
  }
});

// --------------------------MESSAGES------------------------

//Route to render the message page
router.get('/message',isAdmin,(req, res) => {
  res.render('admin/message',{
    successMessage:req.flash('successMessage'),
    errorMessage:req.flash('errorMessage')
  })
})

// Route to send message to students
router.post('/send-message/student',isAdmin, async (req, res) => {
  try {
    const { studentEmail, messageContent } = req.body;

    // Find the student by email
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      console.log('Student not found');
      req.flash('errorMessage','Student not found');
      return res.status(404).redirect(`back`);
    }

    // Create a new comment for the student
    const newComment = new Comment({
      content: messageContent,
      createdBy: req.session.admin._id, // Assuming you're using req.user for the logged-in admin
      createdByModel: 'Admin',
      context: 'student',
      student: student._id,
    });

    await newComment.save();
    req.flash('successMessage','Messaage sent successfully')
    res.status(200).redirect('/admin/message');
  } catch (error) {
    console.error(error);
    req.flash('errorMessage','An error occurred');
    res.status(500).redirect('/admin/message')
  }
});

// Route to send message to teachers
router.post('/send-message/teacher',isAdmin, async (req, res) => {
  try {
    const { teacherEmail, messageContent } = req.body;

    // Find the teacher by email
    const teacher = await Teacher.findOne({ email: teacherEmail });
    if (!teacher) {
      console.log('Teacher not found');
      req.flash('errorMessage','Teacher not found');
      return res.status(404).redirect(`back`);
    }

    // Create a new comment for the teacher
    const newComment = new Comment({
      content: messageContent,
      createdBy: req.session.admin._id, // Assuming you're using req.user for the logged-in admin
      createdByModel: 'Admin',
      context: 'teacher',
      teacher: teacher._id,
    });

    await newComment.save();

    req.flash('successMessage','Messaage sent successfully')
    res.status(200).redirect('/admin/message');

  } catch (error) {
     console.error(error);
      req.flash('errorMessage','An error occurred');
      res.status(500).redirect('/admin/message')
  }
});

// ------------------------------CHAT-------------------------

//teacher
router.get('/chat-teacher',isAdmin, async (req, res) => {
  try {
    const messages = await Comment.find({
      context: 'admin',
      createdByModel: 'Teacher',
    })
    .populate('createdBy')

    if(!messages){
      console.log('No messages found');
      return res.status(404);
    }

    res.render('admin/chatTeacher', { messages });
  } catch (error) {
    console.error('Error fetching chat messages', error);
    req.flash('errorMessage','Error fetching chat messages');
    res.status(500).redirect(`/admin/adminPanel/${req.session.admin._id}`);
  }
});

//student
router.get('/chat-student',isAdmin, async (req, res) => {

  try {
    const messages = await Comment.find({
      context: 'admin',
      createdByModel: 'Student',
    })
    .populate('createdBy')

    if(!messages){
      console.log('No messages found');
      return res.status(404);
    }

    res.render('admin/chatStudent', { messages });
  } catch (error) {
    console.error('Error fetching chat messages', error);
    req.flash('errorMessage','Error fetching chat messages');
    res.status(500).redirect(`/admin/adminPanel/${req.session.admin._id}`);
  }
});

// --------------------------GALLERY----------------------------

//route to render the gallery page
router.get('/gallery', isAdmin, (req, res) => {
  res.render('admin/addAcheivement', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
})

//route to upload the images to the gallery
router.post('/gallery',isAdmin, upload.single('image'), async (req, res) => {
  try {
      const { description } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;// Assuming `upload` middleware provides Cloudinary URL

      const galleryItem = new Gallery({
          description,
          imageUrl,
          uploadedBy: req.session.admin // Assuming Admin is logged in and `req.user` has Admin details
      });

      await galleryItem.save();

      req.flash('successMessage', 'Acheivement uploaded successfully');
      res.redirect(`/admin/gallery`);
  } catch (error) {
      console.error(error);
      req.flash('errorMessage', 'Error uploading Acheivement');
      res.status(500).redirect(`/admin/gallery`);
  }
});

// -----------------------------LOGOUT----------------------------

router.get('/logout',isAdmin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/admin/login');
  });
});

// ------------------------------------------------------------------
module.exports = router;