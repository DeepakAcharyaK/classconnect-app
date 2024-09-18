const express = require('express');
const router = express.Router();
const Teacher = require('../models/teacher.model.js');
const Material=require('../models/material.model.js')
const Classrooms = require('../models/classroom.model.js');
const Notice = require('../models/notice.model.js');
const isTeacher = require('../middlewares/isTeacher.js');
const Quiz = require('../models/quiz.model');
const Admin = require('../models/admin.model.js');
const { validationRules, handleValidationErrors } = require('../utils/validationUtils.js');
const upload = require('../middlewares/upload.js');


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

router.post('/:teacherid/profile/update', upload.single('profileimg'), async (req, res) => {
  try {
      const { name, email, phone } = req.body;
      const profileimg = req.file ? `/uploads/${req.file.filename}` : null; // Use public path for uploaded image
      const teacherId = req.session.teacherid; // Get the teacher's ID from session
      // Build the update object dynamically
      const updateData = { name, email, phone };
      // Only add profileimg if it's uploaded
      if (profileimg) {
          updateData.profileimg = profileimg;
      }
      // Update teacher profile with the available data
      const updatedTeacher = await Teacher.findByIdAndUpdate(teacherId, updateData, {
         new: true 
      });
      req.flash('successMessage','Profile updated successfully.')
      res.status(200).redirect(`/teacher/teacherHome/${teacherId}`);
  } catch (error) {
      req.flash('errorMessage','Error updating profile.')
      res.status(500).redirect(`/teacher/teacherHome/${teacherId}`);
  }
});
 
//-----------------------------create-class----------------------------------

router.post('/teacherHome/:teacherid/classroom/create', isTeacher,upload.fields([{ name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  const { teacherid } = req.params; // Extract the teacher ID from the URL
  const { className, classCode, subjectCode } = req.body; // Extract the className and classCode from the form data

  try {
    const coverImage = req.files['coverImage'] ? `/uploads/${req.files['coverImage'][0].filename}` : null;
    // Create a new classroom document
    const newClassroom = await Classrooms.create({
      name: className,
      subjectCode:subjectCode,
      coverImage:coverImage,
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

//update-class
router.post('/:teacherid/class/update/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { name, subjectCode, coverImage } = req.body;

      // Find the classroom by ID and update it
      await Classrooms.findByIdAndUpdate(id, {
          name,
          subjectCode,
          coverImage
      });

      // Redirect back to the teacher's dashboard or wherever appropriate
      res.redirect(`/teacher/teacherHome/${req.params.teacherid}`);
  } catch (error) {
      console.error('Error updating classroom:', error);
      res.status(500).send('Server Error');
  }
});

//delete-class
router.delete('/class/delete/:classid', async (req, res) => {
  try {
    const classId = req.params.classid;

    // Delete the class from the teacher's created classrooms
    const t=await Teacher.updateOne({ 'classroomcreated': classId }, { $pull: { 'classroomcreated': classId } });
    console.log(t)

    // Delete the class from the Classroom collection
    const deletedClass = await Classrooms.findByIdAndDelete(classId);

    if (deletedClass) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Class not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete class' });
  }
});

//to see classess
router.get('/teacherHome/:teacherid/allcreatedclassess', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.teacherid }).populate('classroomcreated');
    console.log(teacher)
    res.render('teacher/createdClassess', { teacher });
  } catch (error) {
    res.status(500).send('Error retrieving classes');
  }
});

//to see the class details
router.get('/:teacherid/class/:classid/details', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.teacherid });
    const classroom= await Classrooms.findOne({ _id: req.params.classid });
    const material= await Material.find({
       classroom: req.params.classid,
       teacheruploaded:req.params.teacherid
      });
    res.render('teacher/classDetails',{
      classroom,teacher,material
    });
  } catch (error) {
    res.status(500).send('Error retrieving classes');
  }
});

//upload materials
router.post('/:teacherid/class/:classid/materials/upload',isTeacher,upload.single('material') ,async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // File uploaded by Multer is available at req.file
    const fileurl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!fileurl) {
      return res.status(400).send('File upload failed.');
    }

    // Save material to database
    const newMaterial = await Material.create({
      classroom:req.params.classid,
      teacheruploaded:req.params.teacherid,
      title,
      description,
      fileurl
    });

    res.status(200).redirect(`/teacher/${req.params.teacherid}/class/${req.params.classid}/details`);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE Material
router.delete('/material/delete/:id', async (req, res) => {
    try {
        const materialId = req.params.id;
        const material = await Material.findById(materialId);

        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found.' });
        }

        // Remove material from the teacher's uploaded materials
        await Teacher.updateOne(
            { _id: material.uploadedBy },  // Find the teacher who uploaded the material
            { $pull: { uploadedMaterials: materialId } }  // Remove the material from their uploaded materials list
        );

        // Delete the material from the Material model
        await Material.findByIdAndDelete(materialId);

        res.json({ success: true, message: 'Material deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error while deleting material.' });
    }
});

// EDIT Material (POST request)
router.post('/:teacherid/class/:classid/details/material/:materialid/edit', async (req, res) => {
  try {
    const materialId = req.params.materialid;
    const { title, description } = req.body;

    const updatedMaterial = await Material.findByIdAndUpdate(materialId, {
        title: title,
        description: description,
    }, { new: true });

    if (updatedMaterial) {
      // res.send('Done')
        res.redirect(`/teacher/${updatedMaterial.teacheruploaded}/class/${updatedMaterial.classroom}/details`);  // Redirect after successful edit
    } else {
        res.status(404).send('Material not found');
    }
} catch (error) {
    console.error(error);
    res.status(500).send('Server error while updating material.');
}
});


//-----------------------------settings------------------------

router.get('/teacherHome/:teacherid/profile/settings',async (req,res)=>{
  const teacher=await Teacher.findOne({_id:req.params.teacherid})
  res.render('components/setting',{
    teacher:teacher
  })
})

//------------------------------announcement-----------------------------

router.get('/teacherHome/:teacherid/allpublishedaccouncements',async (req,res)=>{
  const teacherAnnouncement=await Teacher.findOne({_id:req.params.teacherid}).populate('announcement')

  res.render('teacher/announcement',{
    teacher:teacherAnnouncement,
    announcements:teacherAnnouncement.announcement
  })
})

router.post('/teacherHome/:teacherId/announcements/create',isTeacher, upload.fields(
  [
    { name: 'coverImage', maxCount: 1 },
    { name: 'attachedFiles', maxCount: 5 }
  ]), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { announcementTitle, announcementBody } = req.body;
    
    // Get the file paths for the uploaded files
    const coverImage = req.files['coverImage'] ? `/uploads/${req.files['coverImage'][0].filename}` : null;
    const attachedFiles = req.files['attachedFiles'] ? req.files['attachedFiles'].map(file => `/uploads/${file.filename}`) : [];

    // Create a new announcement with the provided data
    const newAnnouncement = await Notice.create({
      title: announcementTitle,
      content: announcementBody,
      createdby: teacherId,
      coverImage: coverImage,
      attachedFile: attachedFiles,
    });

    const teacher=await Teacher.findOne({_id:teacherId})
    teacher.announcement.push(newAnnouncement._id);
    await teacher.save();

    req.flash('successMessage','Announcement published successfully')
    res.redirect(`/teacher/teacherHome/${teacherId}`); // Redirect back to the teacher's home page

  } catch (error) {
    req.flash('errorMessage','Error Publishing announcement')
    res.status(500).redirect(`/teacher/teacherHome/${teacherId}`);
  }
});

//------------------------------delete-announcement-----------------------

router.delete('/announcement/delete/:id', async (req, res) => {
    const announcementId = req.params.id;

    try {
        // Find and delete the announcement from the Notice model
        await Notice.findByIdAndDelete(announcementId);

        // Also remove the reference in the Teacher model
        await Teacher.updateMany(
            { announcements: announcementId }, // Find teachers with the announcement
            { $pull: { announcements: announcementId } } // Remove the announcement
        );

        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.json({ success: false, message: 'Failed to delete announcement' });
    }
});


// -----------------------------Teacher-Quiz--------------

router.get('/teacherHome/:teacheid/quiz/create',async(req,res)=>{
  const teacher=await Teacher.findOne({_id:req.params.teacheid})
  res.render('teacher/quiz',{teacher:teacher})
})

router.post('/teacherHome/:teacheid/quiz/create', async (req, res) => {
  const { questions } = req.body;
  
  try {
    const newQuiz = new Quiz({
      questions,
      createdBy: req.params.teacheid,  // Assuming req.user contains the logged-in teacher's info
    });

    await newQuiz.save();
    return res.status(200).json({ message: 'Quiz created successfully' });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return res.status(500).json({ message: 'Failed to create quiz' });
  }
});

router.get('/teacherHome/:teacherid/quiz/myquizzes', async (req, res) => {
  try {
    // Fetch all quizzes created by the logged-in teacher
    const quizzes = await Quiz.find({ createdBy: req.params.teacherid });
    const teacher=await Teacher.findOne({_id:req.params.teacherid})

    // Render the view and pass the quizzes to the template
    res.render('teacher/createdQuiz', { quizzes,teacher});
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});


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
