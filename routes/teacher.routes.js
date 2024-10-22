const express = require('express');
const router = express.Router();

const Teacher = require('../models/teacher.model.js');
const Student = require('../models/student.model.js');
const Material=require('../models/material.model.js');
const Classrooms = require('../models/classroom.model.js');
const Notice = require('../models/notice.model.js');
const Quiz = require('../models/quiz.model');
const Admin = require('../models/admin.model.js');
const Comment = require('../models/comment.model.js');

const isTeacher = require('../middlewares/isTeacher.js');
const bcrypt = require('bcrypt');
const upload = require('../middlewares/upload.js');
const fs = require('fs');
const path = require('path');


// --------------------REGISTRATION-------------------------✅

// GET route for teacher registration
router.get('/register', (req, res) => {
  res.render('teacher/teacherRegister', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
});

// POST route for teacher registration
router.post('/register', async (req, res) => {
  // Destructure registration details from request body
  let { uid, name, email, phone, password } = req.body;
  try {
    // Initialize an array to hold flash messages
    const flashMessages = [];

    // Check if the usn already exists in the Student model
    const existingUid = await Teacher.findOne({ uid });
    if (existingUid) {
      flashMessages.push('UID already exists.');
    }

    // Check if the email already exists in the Student model
    const existingEmail = await Teacher.findOne({ email });
    if (existingEmail) {
      flashMessages.push('Email already exists. Please choose another.');
    }

    // If there are flash messages, send them and redirect back to the registration page
    if (flashMessages.length > 0) {
      flashMessages.forEach(message => req.flash('errorMessage', message));
      return res.status(400).redirect('/teacher/register');
    }

    // Generate a salt for hashing the password
    const salt = await bcrypt.genSalt(10);
    // Hash the password using bcrypt with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create the new student in the database with hashed password
    const createdTeacher = await Teacher.create({
      uid,
      name,
      email,
      phone,
      password: hashedPassword // Store hashed password
    });

    req.flash('successMessage', 'Registration successful.');
    return res.status(201).redirect('/teacher/login');
  } catch (err) {
    console.log( 'Registration failed. Please try again.',err)
    req.flash('errorMessage', 'Registration failed. Please try again.');
    return res.status(500).redirect('/teacher/register');
  }
});

// ----------------------LOGIN---------------------------✅

//GET route for login
router.get('/login', (req, res) => {
  res.render('teacher/teacherLogin', {
    successMessage: req.flash('successMessage'),
    errorMessage: req.flash('errorMessage')
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('errorMessage', 'Email and Password are required');
    return res.status(400).redirect('/teacher/login');
  }

  try {
    const foundTeacher = await Teacher.findOne({ email });

    if (!foundTeacher) {
      req.flash('errorMessage', 'Invalid Email or Password');
      console.log('Invalid Email or Password')
      return res.status(401).redirect('/teacher/login');
    }

    if (!foundTeacher.isApproved) {
      req.flash('errorMessage', 'Your registration is pending approval');
      console.log('Your registration is pending approval')
      return res.status(401).redirect('/teacher/login');
    }

    const isMatch = await bcrypt.compare(password, foundTeacher.password);

    if (!isMatch) {
      req.flash('errorMessage', 'Invalid Email or Password');
      console.log('Invalid Email or Password')
      return res.status(401).redirect('/teacher/login');
    }

    // Store the teacher details in session for authenticated access
    req.session.teacher = foundTeacher;

    // Set a success flash message
    req.flash('successMessage', 'Login successful');

    // Redirect to the teacher's home page instead of rendering it directly
    return res.status(200).redirect(`/teacher/teacherHome/${foundTeacher._id}`);

  } catch (error) {
    console.log(error);
    req.flash('errorMessage', 'Internal server error');
    return res.status(500).redirect('/teacher/login');
  }
});

// ---------------------HOME---------------------------✅

//GET route for render the home page
router.get('/teacherHome/:teacherid',isTeacher, async (req, res) => {
  const teacher = await Teacher.findById(req.params.teacherid).populate('classroomcreated');

  try {

    if (!teacher) {
      req.flash('errorMessage', 'Teacher not found.');
      return res.status(404).redirect('/teacher/login'); // Redirect to login if teacher not found
    }

    // Render the teacher's home page with flash messages
    res.render('teacher/teacherHome', {
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage'),
      teacher,
    });

  } catch (error) {

    console.log('Something went wrong:', error); // Log the error for debugging
    req.flash('errorMessage', 'An error occurred while loading the page.');
    res.status(500).redirect(`/teacher/teacherHome/${teacher._id}`); // Optionally redirect to an error page
  }
});

// --------------------PROFILE-------------------------✅

//GET route for updating the profile information
router.post('/:teacherid/profile/update',isTeacher, upload.single('profileimg'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const teacherId = req.params.teacherid; 
    
    if (!teacherId) {
      req.flash('errorMessage', 'Teacher ID is missing.');
      return res.status(400).redirect(`/teacher/login`);
    }

    const profileimg = req.file ? `/uploads/${req.file.filename}` : null;

    // Build the update object dynamically
    const updateData = { name, email, phone };

    if (profileimg) {
      updateData.profileimg = profileimg;
    }

    // Update teacher profile
    const updatedTeacher = await Teacher.findByIdAndUpdate(teacherId, updateData, {
      new: true, 
    });

    // Check if the teacher update was successful
    if (!updatedTeacher) {
      req.flash('errorMessage', 'Failed to update the profile.');
      return res.status(404).redirect(`/teacher/teacherHome/${teacherId}`);
    }

    req.flash('successMessage', 'Profile updated successfully.');
    res.status(200).redirect(`/teacher/teacherHome/${teacherId}`);
  } catch (error) {
    console.log('Error updating profile:', error);
    req.flash('errorMessage', 'Error updating profile.');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacherid}`);
  }
});

//---------------------CREATE CLASS--------------------✅

//GET route for creating the new class
router.post('/teacherHome/:teacherid/classroom/create',isTeacher, upload.single('coverImage'), async (req, res) => {
  const { teacherid } = req.params;
  const { className, classCode, subjectCode } = req.body; 

  try {
    // Check if a cover image was uploaded, otherwise set it to default image
    const coverImage = req.file ? `/uploads/${req.file.filename}` : '/images/class_bg.webp';

    // Create a new classroom document
    const newClassroom = await Classrooms.create({
      name: className,
      subjectCode: subjectCode,
      coverImage: coverImage,
      code: classCode,
      createdteacher: teacherid, 
    });

    const teacher = await Teacher.findById(teacherid);

    if (teacher) {
      // Add the new classroom to the teacher's classroomcreated array
      teacher.classroomcreated.push(newClassroom._id); 
      await teacher.save(); 

      // Flash a success message and redirect to the teacher's home page
      req.flash('successMessage', 'Classroom created successfully');
      res.redirect(`/teacher/teacherHome/${teacherid}`);
    } else {
      // If the teacher is not found, handle the error
      console.log('Teacher not found');
      res.status(404);
    }
  } catch (error) {
    console.error('Error creating classroom:', error); // Log the error for debugging
    req.flash('errorMessage', 'Internal Server Error');
    res.status(500).redirect(`/teacher/teacherHome/${teacherid}`);
  }
});

//--------------------VIEW/UPDATE/DELETE CLASS----------✅

//GET route for VIEW the created class
router.get('/teacherHome/:teacherid/allcreatedclassess',isTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.teacherid }).populate('classroomcreated');

    if (!teacher) {
      console.log('Teacher not found');
      return res.status(400)
    }

    // Render the created classes page and pass necessary data
    res.render('teacher/createdClasses', { 
      teacher,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage'),
    });
  } catch (error) {
    console.error('Error retrieving created classes:', error);
    req.flash('errorMessage', 'Internal Server Error');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacherid}`);
  }
});

//DELETE route for DELETE the created class
router.delete('/class/delete/:classid',isTeacher, async (req, res) => {
  try {
    const classId = req.params.classid;

    // Remove the class from the teacher's created classrooms array
    const deletedClassFromCreated = await Teacher.updateOne(
      { classroomcreated: classId }, 
      { $pull: { classroomcreated: classId } }
    );

    if (!deletedClassFromCreated.ok) {
      console.log('Failed to delete class from teacher');
      res.status(404);
    }

    // Delete the class from the Classroom collection
    const deletedClass = await Classrooms.findByIdAndDelete(classId);

    if (deletedClass) {
      res.json({ success: true });
    } else {
      req.flash('errorMessage','Failed to delete class')
      res.status(404).json({ success: false, message: 'Class not found' });
    }
  } catch (error) {
    console.error('Error deleting class:', error);
    req.flash('errorMessage','Failed to delete class');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.classid}/allcreatedclassess`);
  }
});

//POST route for UPDATE the created class
router.post('/:teacherid/class/update/:id',isTeacher, upload.single('coverImage'), async (req, res) => {
  try {
    const { id, teacherid } = req.params;
    const { name, subjectCode } = req.body;
    let coverImageUrl;

    // Check if a new cover image was uploaded
    if (req.file) {
      coverImageUrl = `/uploads/${req.file.filename}`;
    }

    // Update the classroom with the new data
    const updatedClassroom = await Classrooms.findByIdAndUpdate(id, {
      name,
      subjectCode,
      coverImage: coverImageUrl || undefined,  // Keep existing image if no new image uploaded
    }, { new: true });

    if (!updatedClassroom) {
      console.log('Classroom not found');
      return res.status(404).redirect(`/teacher/teacherHome/${teacherid}/allcreatedclassess`);
    }

    // Flash success message and redirect back to the teacher's dashboard
    req.flash('successMessage', 'Classroom updated successfully');
    res.status(200).redirect(`/teacher/teacherHome/${teacherid}/allcreatedclassess`);
  } catch (error) {
    console.error('Error updating classroom:', error);
    req.flash('errorMessage', 'Error updating classroom');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacheid}/allcreatedclassess`);
  }
});

// -----------------------MATERIALS---------------------✅

//GET route for fetch the details
router.get('/:teacherid/class/:classid/details', isTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.teacherid });
    if (!teacher) {
      console.log('Teacher not found');
      return res.status(404);
    }

    const classroom = await Classrooms.findOne({ _id: req.params.classid });
    if (!classroom) {
      console.log('Class not found');
      return res.status(404);
    }

    const material = await Material.find({
      classroom: req.params.classid,
      teacheruploaded: req.params.teacherid
    });

    res.render('teacher/classDetails', {
      classroom,
      teacher,
      material,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage'),
    });

  } catch (error) {
    console.error('Error retrieving class details:', error);
    req.flash('errorMessage','Error in retrieving class details')
    res.status(500).redirect(`/teacher/teacherHome/${req.session.teacher._id}`);
  }
});

//POST route for upload materials
router.post('/:teacherid/class/:classid/materials/upload', isTeacher, upload.array('material', 10), async (req, res) => {
  try {
    const { title, description } = req.body;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      console.log('No files were uploaded')
      return res.status(400);
    }

    // Map the uploaded files to generate file URLs
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`|| null);

    // Create a new material record
    const newMaterial = await Material.create({
      classroom: req.params.classid,
      teacheruploaded: req.params.teacherid,
      title,
      description,
      attachedFile: fileUrls // Save file URLs in the attachedFile array
    });

    // Save the new material
    await newMaterial.save();

    // Find the classroom and add the new material to its materials list
    const classroommaterial = await Classrooms.findOne({ _id: req.params.classid });

    if (!classroommaterial) {
      console.log('Classroom not found');
      return res.status(404);
    }

    classroommaterial.materialsavailable.push(newMaterial);
    await classroommaterial.save();

    req.flash('successMessage','Materials uploaded successfully')
    // Redirect to the class details page after successful upload
    res.status(200).redirect(`/teacher/${req.params.teacherid}/class/${req.params.classid}/details`);
  } catch (error) {
    console.error('Error uploading materials:', error);
    req.flash('errorMessage','Failed to upload materials')
    res.status(500).redirect(`/teacher/${req.params.teacherid}/class/${req.params.classid}/details`);
  }
});

//DELETE route for DELETE Material (along with attachments)
router.delete('/material/delete/:id',isTeacher, async (req, res) => {
  try {
      const materialId = req.params.id;
      
      // Find the material to delete
      const material = await Material.findById(materialId);
      if (!material) {
          console.log('Material not found')
          return res.status(404);
      }

      // Remove the material from the teacher's uploaded materials
      await Teacher.updateOne(
          { _id: material.teacheruploaded },  // Find the teacher who uploaded the material
          { $pull: { uploadedMaterials: materialId } }  // Remove the material from the uploadedMaterials list
      );

      // Remove the material from the classroom's materialsavailable
      await Classrooms.updateOne(
          { _id: material.classroom },  // Find the classroom
          { $pull: { materialsavailable: materialId } }  // Remove the material from the materials list
      );

      // Delete the material from the Material collection
      await Material.findByIdAndDelete(materialId);

      res.json({ success: true, message: 'Material deleted successfully.' });
  } catch (error) {
      console.error('Error while deleting material:', error);
      res.status(500).json({ success: false, message: 'Server error while deleting material.' });
  }
});

//POST route EDIT Material (POST request) (only title and description)
router.post('/:teacherid/class/:classid/details/material/:materialid/edit',isTeacher, async (req, res) => {
  try {
    const { materialid, teacherid, classid } = req.params;
    const { title, description } = req.body;

    // Check if required fields are provided
    if (!title || !description) {
      console.log('Title and description are required.')
      return res.status(400);
    }

    // Update the material details
    const updatedMaterial = await Material.findByIdAndUpdate(
      materialid, 
      { title, description }, 
      { new: true }
    );

    if (updatedMaterial) {
      req.flash('Details upadated successfully')
      res.redirect(`/teacher/${teacherid}/class/${classid}/details`);
    } else {
      console.log('Material not found');
      res.status(404);
    }
  } catch (error) {
    console.error('Error while updating material:', error);
    req.flash('errorMessage', 'Server error while updating material.');
    res.status(500).redirect(`/teacher/${req.params.teacherid}/class/${req.params.classid}/details`);
  }
});

//GET Route to get the details of a material uploaded by the teacher
router.get('/:teacherid/material/:materialid/details', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.teacherid });
    if (!teacher) {
      console.log('Teacher not found');
      return res.status(404);
    }

    const material = await Material.findById(req.params.materialid).populate('teacheruploaded');
    if (!material) {
      return res.status(404).send('Material not found');
    }
    res.render('teacher/materialDetails', { material,teacher });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// Route to delete an attached file from the material
router.delete('/material/:materialid/file', async (req, res) => {
  try {
    const { fileUrl } = req.body;
    const material = await Material.findById(req.params.materialid);
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    // Remove the file from attachedFile array
    material.attachedFile = material.attachedFile.filter(file => file !== fileUrl);

    // Save updated material
    await material.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

//-----------------------PROFILE------------------------✅

// GET route for fetch info. teacher profile 
router.get('/teacherHome/:teacherid/profile/settings',isTeacher, async (req, res) => {
  try {
    // Fetch the teacher from the database
    const teacher = await Teacher.findById(req.params.teacherid);

    // Check if teacher exists
    if (!teacher) {
      req.flash('errorMessage', 'Teacher not found.');
      return res.redirect(`/teacher/teacherHome/${req.params.teacherid}`);
    }

    // Render the settings page and pass the teacher object
    res.render('components/setting', { 
      successMessage:req.flash('successMessage'),
      errorMessage:req.flash('errorMessage'),
      teacher 
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    req.flash('errorMessage', 'Something went wrong. Please try again later.');
    res.redirect(`/teacher/teacherHome/${req.params.teacherid}`);
  }
});

//------------------------ANNOUNCEMENT-------------------✅

//POST route to CREATE announcement
router.post('/teacherHome/:teacherId/announcements/create', isTeacher, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'attachedFiles', maxCount: 5 }
]), async (req, res) => {
  try {
      const { teacherId } = req.params;
      const { announcementTitle, announcementBody } = req.body;

      // Get the file paths for the uploaded files
      const coverImage = req.files['coverImage'] 
          ? `/uploads/${req.files['coverImage'][0].filename}` 
          : '/images/alert.jpg';

      const attachedFiles = req.files['attachedFiles'] 
          ? req.files['attachedFiles'].map(file => `/uploads/${file.filename}`) 
          : [];

      // Create a new announcement with the provided data
      const newAnnouncement = await Notice.create({
          title: announcementTitle,
          content: announcementBody,
          createdby: teacherId,
          coverImage: coverImage,
          attachedFile: attachedFiles,
      });

      // Add the announcement to the teacher's document
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
          req.flash('errorMessage', 'Teacher not found');
          return res.status(404).redirect(`/teacher/teacherHome/${teacherId}`);
      }

      teacher.announcement.push(newAnnouncement._id);
      await teacher.save();

      req.flash('successMessage', 'Announcement published successfully');
      res.redirect(`/teacher/teacherHome/${teacherId}`);

  } catch (error) {
      console.error('Error publishing announcement:', error);
      req.flash('errorMessage', 'Error publishing announcement');
      res.status(500).redirect(`/teacher/teacherHome/${req.params.teacherId}`);
  }
});

//GET route to DISPLAY ALL created announcements
router.get('/teacherHome/:teacherid/allpublishedaccouncements',isTeacher, async (req, res) => {
  try {
    const teacherAnnouncement = await Teacher.findOne({ _id: req.params.teacherid })
      .populate('announcement');

    if (!teacherAnnouncement) {
      console.log('Announcement published teacher not found');
      req.flash('errorMessage', 'Teacher not found');
      return res.status(404).redirect(`/teacher/teacherHome/${req.session.teacher._id}`);
    }

    // Sort announcements by creation date in descending order
    const sortedAnnouncements = teacherAnnouncement.announcement.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.render('teacher/announcement', {
      teacher: teacherAnnouncement,
      announcements: sortedAnnouncements,
      successMessage:req.flash('successMessage'),
      errorMessage:req.flash('errorMessage')
    });
  } catch (error) {
    console.error(error);
    req.flash('Unable to fetch the announcement deatails')
    res.status(500).redirect(`/teacher/teacherHome/${req.session.teacher._id}`);
  }
});

//GET route to DISPLAY PARTICULAR AVVOUNCEMENT DETAILS 
router.get('/announcement/details/:announcementId',isTeacher, async (req, res) => {
  try {
    const announcement = await Notice.findById(req.params.announcementId).populate('createdby'); // Adjust to your model name

    if (!announcement) {
      console.log('Announcement not found');
      req.flash('errorMessage','Announcement not found');
      return res.status(404).redirect(`/teacher/teacherHome/${req.session.teacher._id}`);
    }

    res.render('teacher/announcementDetails', { // Create this new EJS file for the details page
      announcement: announcement,
      teacher:announcement.createdby,
      successMessage:req.flash('successMessage'),
      errorMessage:req.flash('errorMessage')
    });
  } catch (error) {
    console.error(error);
    req.flash('Unable to fetch the announcement details');
    res.status(500).redirect(`/teacher/teacherHome/${req.session.teacher._id}`);
  }
});

// POST route to DELETE PARTICULAR ATTACHED FILE
router.delete('/announcement/file/delete', isTeacher, async (req, res) => {
  const teacherId = req.session.teacher._id;

  try {
    const { file } = req.body;

    // Find the announcement that contains the file
    const announcement = await Notice.findOne({ attachedFile: file });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'File or announcement not found.' });
    }

    // Check if the teacher is authorized to delete this file
    if (announcement.createdby.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this file.' });
    }

    // Remove the file from the announcement's attachedFile array
    const updatedFiles = announcement.attachedFile.filter(attached => attached !== file);
    announcement.attachedFile = updatedFiles;

    // Save the updated announcement
    await announcement.save();

    // Optionally, delete the file from the server (if stored locally)
    const filePath = path.join(__dirname, '../uploads/', path.basename(file))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Send JSON response back to the client
    return res.status(200).json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while deleting the file.' });
  }
});

//DELETE route to DELETE the announcement
router.delete('/announcement/delete/:id',isTeacher, async (req, res) => {
  const announcementId = req.params.id;
  const teacherid = req.session.teacher._id;

  try {
      const announcement = await Notice.findById(announcementId);

      if (!announcement) {
          console.log('Announcement not found');
          return res.status(404).redirect(`/teacher/teacherHome/${teacherid}/allpublishedaccouncements`)
      }

      // Delete the announcement from the Notice model
      await Notice.findByIdAndDelete(announcementId);

      // Remove the reference from all teachers' announcements array
      await Teacher.updateMany(
          { announcements: announcementId }, // Find teachers with this announcement
          { $pull: { announcements: announcementId } } // Remove the announcement from their list
      );
      req.flash('successMessage','Successfully deleted')
      res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
      console.error('Error deleting announcement:', error);
      req.flash('errorMessage', 'Error deleting announcement')
      res.status(500).redirect(`/teacher/teacherHome/${teacherid}/allpublishedaccouncements`)
  }
});

// -------------------------QUIZ----------------------✅

//GET route to create the quiz
router.get('/teacherHome/:teacheid/quiz/create',isTeacher,async(req,res)=>{
  try{
    const teacher=await Teacher.findOne({_id:req.params.teacheid})

    if(!teacher){
      console.log('To create quiz teacher not found')
      res.status(404);
    }
    res.render('teacher/quiz',{
      teacher,
      successMessage:req.flash('successMessage'),
      errorMessage:req.flash('errorMessage'),
    })
  }
  catch{
    console.log('something went wrong while rendering quiz');
    req.flash('errorMessage','Inetrnel server error');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacheid}`)
  }
})

//POST route to create the quiz
router.post('/teacherHome/:teacherid/quiz/create',isTeacher, async (req, res) => {
  const { title, description, time, questions } = req.body;  // Extract title, description, time, and questions from req.body

  try {
    // Create a new Quiz object with the data from the frontend
    const newQuiz = new Quiz({
      title,               
      description,         
      time, 
      questions,           
      createdBy: req.params.teacherid, 
    });

    // Save the new quiz to the database
    await newQuiz.save();

    // Send a success response
    return res.status(200).json({ message: 'Quiz created successfully' });
  } catch (error) {
    // Handle any errors during quiz creation
    console.error('Error creating quiz:', error);
    return res.status(500).json({ message: 'Failed to create quiz' });
  }
});

//GET route to fetch the ALL created quiz information
router.get('/teacherHome/:teacherid/quiz/myquizzes',isTeacher, async (req, res) => {
  try {
    // Fetch all quizzes created by the logged-in teacher
    const quizzes = await Quiz.find({ createdBy: req.params.teacherid });
    const teacher=await Teacher.findOne({_id:req.params.teacherid})

    if(!teacher) {
      console.error('Teacher not found inside the quiz');
      res.status(404);
    }
    if(!quizzes){
      console.error('Quiz not found');
      res.status(404);
    }

    // Render the view and pass the quizzes to the template
    res.render('teacher/createdQuiz', 
      { 
        quizzes,teacher,
        successMessage: req.flash('successMessage'),
        errorMessage: req.flash('errorMessage'),
      }
    );
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacherid}`);
  }
});

//GET Route to fetch detailed quiz info
router.get('/teacherHome/:teacherid/quiz/:quizid',isTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherid);
    if (!teacher) {
      console.log('Teacher not found');
      return res.status(404);
    }

    const quiz = await Quiz.findById(req.params.quizid)
      .populate('studentsTaken.student', 'profileimg usn name') // Populate student data
      .exec();

    if (!quiz) {
      console.log('Quiz not found');
      return res.status(404);
    }

    res.render('teacher/viewQuiz', {
      quiz,
      teacher,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage'),
    });
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    req.flash('errorMessage','Error fetching quiz details');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacherid}/quiz/myquizzes`);
  }
});

//POST Route to start/stop the quiz
router.post('/teacherHome/:teacherid/quiz/:quizid/toggle',isTeacher, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizid);
    if (!quiz) {
      console.log('Quiz not found');
      return res.status(404);
    }

    // Toggle the `isOpen` status
    quiz.isOpen = !quiz.isOpen;
    await quiz.save();

    res.redirect(`/teacher/teacherHome/${req.params.teacherid}/quiz/${quiz._id}`);
  } catch (error) {
    console.error('Error updating quiz status:', error);
    req.flash('errorMessage', 'Error updating quiz status. Please try again.');
    res.status(500).redirect(`/teacher/teacherHome/${req.params.teacherid}/quiz/${req.params.quizid}`);
  }
});

// POST Route to delete a quiz
router.post('/teacherHome/:teacherId/quiz/:quizId/delete',isTeacher, async (req, res) => {
  const { teacherId, quizId } = req.params;

  try {
    await Quiz.findByIdAndDelete(quizId);

    await Teacher.findByIdAndUpdate(teacherId, { 
      $pull: { quizcreated: quizId } 
    });
    await Student.updateMany(
      { 'quiztaken.quizId': quizId }, 
      { $pull: { quiztaken: { quizId: quizId } } } 
    );

    // Flash a success message and redirect to the teacher's quiz list
    req.flash('successMessage', 'Quiz deleted successfully');
    res.status(200).redirect(`/teacher/teacherHome/${teacherId}/quiz/myquizzes`);
  } catch (error) {
    // Handle any errors that occur during deletion
    console.error("Error deleting quiz:", error);
    req.flash('errorMessage', 'Failed to delete the quiz');
    res.status(500).redirect(`/teacher/teacherHome/${teacherId}/quiz/myquizzes`);
  }
});

// ----------------------SEE ENROLLED STUDENTS--------------------

router.get('/teacherHome/:teacherId/classroom/:classroomId/enrolledStudents',isTeacher, async (req, res) => {
  const { classroomId } = req.params;

  try {
    // Find the classroom and populate the studentsenrolled field with student details
    const classroom = await Classrooms.findById(classroomId)
      .populate({
        path: 'studentsenrolled',
        select: 'usn name createdAt profileimg' // Only selecting relevant fields
      })
      .exec();

    // Sort the students by enrollment date (descending order)
    const students = classroom.studentsenrolled.sort((a, b) => b.createdAt - a.createdAt);

    // Render the view with the student data
    res.render('teacher/enrolledStudents', { students, classroom });
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).send('Error fetching enrolled students');
  }
});

//--------------------------COMMENT-------------------------------

// Route to render the message page with students enrolled in the teacher's classroom
router.get('/:teacherid/message',isTeacher, async (req, res) => {
  try {
    const { teacherid } = req.params;

    // Find classrooms created by the teacher
    const classrooms = await Classrooms.find({ createdteacher: teacherid }).populate('studentsenrolled');

    // Extract students from those classrooms
    let studentIds = [];
    classrooms.forEach(classroom => {
      studentIds = studentIds.concat(classroom.studentsenrolled);
    });

    // Fetch student details
    const students = await Student.find({ _id: { $in: studentIds } });

    // Render the message page and pass the students
    res.render('teacher/message', { 
      students, 
      teacher:req.session.teacher,
      successMessage:req.flash('successMessage'),
      errorMessage:req.flash('errorMessage'),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// POST Route to handle comment/suggestion creation for CLASSROOM
router.post('/:teacherid/class/:classid/comment', isTeacher, async (req, res) => {
  const { content, type, targetId, createdBy, createdByModel } = req.body; // added createdByModel to track the creator's model
  const { teacherid, classid } = req.params;

  console.log(createdBy, createdByModel);

  try {
    // Create base comment data
    let commentData = {
      content,
      createdBy:teacherid,       // The creator's ID (could be a teacher, student, or admin)
      createdByModel:'Teacher',  // The creator's model ('Teacher', 'Student', or 'Admin')
      context: type,   // The context of the comment (e.g., 'classroom', 'teacher', 'admin')
    };

    // Handle different comment contexts
    switch (type) {
      case 'classroom':
        const classroom = await Classrooms.findById(targetId);
        if (!classroom) {
          req.flash('errorMessage', 'Classroom not found');
          return res.status(404).redirect(`/teacher/${teacherid}/class/${classid}/details`);
        }
        commentData.classroom = targetId; // Associate the comment with the classroom
        break;

      default:
        req.flash('errorMessage', 'Invalid context or target.');
        return res.status(400).redirect(`/teacher/${teacherid}/class/${classid}/details`);
    }

    // Save the new comment to the database
    const newComment = new Comment(commentData);
    await newComment.save();

    // Respond with success message and the new comment
    req.flash('successMessage', 'Message sent successfully');
    res.status(201).redirect(`back`); ///teacher/${teacherid}/class/${classid}/details

  } catch (error) {
    // Handle errors and respond with a 500 status
    console.log('Error adding comment', error);
    req.flash('errorMessage', 'Server error.');
    res.status(500).redirect(`/teacher/${teacherid}/class/${classid}/details`);
  }
});


// POST route to send a message to ADMIN or STUDENTS
router.post('/:teacherid/message', isTeacher, async (req, res) => {
  const { content, type, targetId } = req.body;
  const { teacherid } = req.params;

  try {
    // Base comment data with teacher as the creator
    let commentData = {
      content,
      createdBy: teacherid, // Reference to the teacher's ID
      createdByModel: 'Teacher', // Reference the 'Teacher' model dynamically
      context: type,  // Set the context of the comment ('student', 'admin', etc.)
    };

    // Handle different comment contexts based on 'type'
    switch (type) {
      case 'student':
        const student = await Student.findById(targetId);
        if (!student) {
          req.flash('errorMessage', 'Student not found');
          return res.status(404).redirect(`/teacher/${teacherid}/message`);
        }
        commentData.student = targetId; // Save the student ID
        break;

      case 'admin':
        const admin = await Admin.findOne({ name: 'Admin' });
        if (!admin) {
          req.flash('errorMessage', 'Admin not found');
          return res.status(404).redirect(`/teacher/${teacherid}/message`);
        }
        commentData.admin = admin._id; // Save the admin ID
        break;

      default:
        req.flash('errorMessage', 'Invalid receiver type.');
        return res.status(400).redirect(`/teacher/${teacherid}/message`);
    }

    // Save the new comment in the database
    const newComment = new Comment(commentData);
    await newComment.save();

    // Success message and redirect
    req.flash('successMessage', 'Message sent successfully');
    res.status(201).redirect(`/teacher/${teacherid}/message`);

  } catch (error) {
    console.log('Error adding comment', error);
    req.flash('errorMessage', 'Server error.');
    res.status(500).redirect(`/teacher/${teacherid}/message`);
  }
});

//inbox
router.get('/message', isTeacher, async (req, res) => {
  try {

    // Fetch messages where the context is 'student', createdByModel is 'Teacher' or 'Admin', and the student matches
    const messages = await Comment.find({
      teacher: req.session.teacher._id, // Directly match the student object ID
      context: 'teacher',
      createdByModel: { $in: ['Student', 'Admin'] } // Check for both 'Teacher' and 'Admin'
    }).populate('createdBy'); // Populate the 'createdBy' field

    // If no messages found, return 404 with a message
    if (!messages || messages.length === 0) {
      console.log('No messages found');
    }

    // Render the 'student/inbox' view with the messages and student data
    res.render('teacher/inbox', { 
      messages,
      teacher:req.session.teacher
    });
  } catch (error) {
    console.error('Error fetching chat messages', error);
    req.flash('errorMessage', 'Error fetching chat messages');
    // Redirect to the admin panel in case of error (you may want to modify this if the error occurs for students)
    res.status(500).redirect(`/admin/adminPanel/${req.session.admin._id}`);
  }
});

// ---------------------------TEACHER LOGOUT------------------------✅
router.get('/logout',isTeacher, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
      req.flash('errorMessage', 'Error logging out. Please try again.');
      return res.redrect(`/teacher/teacherHome/${req.session.teacher._id}`); // Redirect back to home on error
    }
    res.redirect('/teacher/login'); // Redirect to login page after logout
  });
});

module.exports = router;
