const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const router = express.Router();
const Teacher = require('../models/teacher.model.js');
const Student = require('../models/student.model.js');
const Admin = require('../models/admin.model.js'); // Assuming the HOD model is used for login and management
const Gallery = require('../models/gallery.model.js');
const upload = require('../middlewares/upload.js');


// Middleware to check if the user is HOD
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    console.log(req.session)
    next();
  } else {
    res.redirect('/admin/login'); // Redirect to HOD login if not authenticated
  }
};

// HOD Registration Page
router.get('/register', (req, res) => {
  res.render('admin/adminRegister');
});

// HOD Registration Handler
router.post('/register',(req,res)=>{
  let { name,password } = req.body
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, async function(err, hash) {
        craetedAdmin=await Admin.create({
          name,
          password:hash
        })
        console.log(craetedAdmin)
    });
  });
  res.redirect('/admin/login')
})

// HOD Login Page
router.get('/login', (req, res) => {
  res.render('admin/adminLogin');
});

// HOD Login Handler
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const admin = await Admin.findOne({ name });

    if (!admin) {
      req.session.message = 'Invalid credentials';
      return res.redirect('/admin/login');
    }

    // Compare the hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      req.session.message = 'Invalid credentials';
      return res.redirect('/admin/login');
    }

    req.session.isAdmin = true;
    req.session.user=admin;

    res.redirect(`/admin/adminPanel/${admin._id}`);

  } catch (err) {
    console.error(err); // Log error for debugging
    req.session.message = 'Error logging in';
    res.redirect('/admin/login');
  }
});

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

// Approve Teacher
router.post('/approve/teacher/:id', isAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      req.session.message = 'Teacher not found';
      return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
    }

    teacher.isApproved = true;
    await teacher.save();

    req.session.message = 'Teacher approved successfully';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  } catch (err) {
    req.session.message = 'Error approving teacher';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  }
});

// Reject Teacher
router.post('/reject/teacher/:id', isAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      req.session.message = 'Teacher not found';
      return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
    }

    await Teacher.deleteOne({ _id: req.params.id });

    req.session.message = 'Teacher rejected successfully';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  } catch (err) {
    req.session.message = 'Error rejecting teacher';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  }
});

// Delete Teacher
router.post('/delete/teacher/:id', isAdmin, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      req.session.message = 'Teacher not found';
      return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
    }

    await Teacher.deleteOne({ _id: req.params.id });

    req.session.message = 'Teacher deleted successfully';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  } catch (err) {
    req.session.message = 'Error deleting Teacher';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  }
});

// Delete Student
router.post('/delete/student/:id', isAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      req.session.message = 'Student not found';
      return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
    }

    await Student.deleteOne({ _id: req.params.id });

    req.session.message = 'Student deleted successfully';
    res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  } catch (err) {
    req.session.message = 'Error deleting student';
    return res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  }
});



//Gallery
router.post('/gallery', upload.single('image'), async (req, res) => {
  try {
      const { description } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;// Assuming `upload` middleware provides Cloudinary URL

      const galleryItem = new Gallery({
          description,
          imageUrl,
          uploadedBy: req.session.user // Assuming Admin is logged in and `req.user` has Admin details
      });

      await galleryItem.save();
      res.redirect(`/admin/adminPanel/${req.session.user._id}`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error uploading image');
  }
});



// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    // console.log(req.session.isAdmin)
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/admin/login');
  });
});

module.exports = router;