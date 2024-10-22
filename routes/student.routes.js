const express=require('express')
const router=express.Router()

const Student=require('../models/student.model.js')
const Classroom=require('../models/classroom.model.js')
const Teacher=require('../models/teacher.model.js')
const Admin=require('../models/admin.model.js')
const Gallery=require('../models/gallery.model.js')
const Comment=require('../models/comment.model.js')
const Quiz=require('../models/quiz.model.js')
const Material=require('../models/material.model.js')
const Notice=require('../models/notice.model.js')

const upload = require('../middlewares/upload.js');
const isStudent = require('../middlewares/isStudent.js');

const bcrypt = require('bcrypt');


// --------------------REGISTRATION-------------------------✅

// GET route for student registration
router.get('/register',(req,res)=>{
    res.render('student/studentRegister',{
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage')
    })
})

// POST route for student registration
router.post('/register', async (req, res) => {
  // Destructure registration details from request body
  let { usn, name, email, phone, password } = req.body;
  try {
    // Initialize an array to hold flash messages
    const flashMessages = [];

    // Check if the usn already exists in the Student model
    const existingUsn = await Student.findOne({ usn });
    if (existingUsn) {
      flashMessages.push('USN already exists.');
    }

    // Check if the email already exists in the Student model
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      flashMessages.push('Email already exists. Please choose another.');
    }

    // If there are flash messages, send them and redirect back to the registration page
    if (flashMessages.length > 0) {
      flashMessages.forEach(message => req.flash('errorMessage', message));
      return res.status(400).redirect('/student/register');
    }

    // Generate a salt for hashing the password
    const salt = await bcrypt.genSalt(10);
    // Hash the password using bcrypt with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create the new student in the database with hashed password
    const createdStudent = await Student.create({
      usn,
      name,
      email,
      phone,
      password: hashedPassword // Store hashed password
    });
    req.flash('successMessage', 'Registration successful.');
    // Redirect to the login page after successful registration
    return res.status(201).redirect('/student/login');
  } catch (err) {
    // Set a flash message to inform the user of the error (optional)
    req.flash('errorMessage', 'Registration failed. Please try again.');
    // Redirect back to the registration page if there's an error
    return res.status(500).redirect('/student/register');
  }
});

//------------------------LOGIN----------------------------✅

// GET route for handling student login
router.get('/login',(req,res)=>{
    res.render('student/studentLogin',{
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage')
    })
})

// POST route for handling student login
router.post('/login', async (req, res) => {
  // Destructure email and password from request body
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    req.flash('errorMessage', 'Email and Password are required');
    return res.status(400).redirect('/student/login'); // Status 400 for bad request if fields are missing
  }

  try {
    // Find the student by email in the database
    const foundStudent = await Student.findOne({ email });

    // If no student is found, flash an error and redirect to login page
    if (!foundStudent) {
      req.flash('errorMessage', 'Invalid Email or Password');
      return res.status(401).redirect('/student/login'); // Status 401 for unauthorized access
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, foundStudent.password);

    // If the password doesn't match, flash an error and redirect to login page
    if (!isMatch) {
      req.flash('errorMessage', 'Invalid Email or Password');
      return res.status(401).redirect('/student/login'); // Status 401 for unauthorized access
    }

    // Store the student details in session for authenticated access
    req.session.student = foundStudent;

    // Set a success flash message and redirect the student to their home page
    req.flash('successMessage', 'Login successful');
    return res.status(200).redirect(`/student/home/${foundStudent._id}`); // Status 200 for successful login

  } catch (error) {
    // Set a flash message for internal server errors and redirect to login page
    req.flash('errorMessage', 'Internal server error');
    return res.status(500).redirect('/student/login'); // Status 500 for internal server error
  }
});

// ------------------------HOME---------------------------------✅

// GET route for the student's home page
router.get('/home/:studentid',isStudent, async (req, res) => {
  const { studentid } = req.params;

  try {
    const quiz = await Quiz.find(); 
    const student = await Student.findOne({ _id: studentid }).populate('quiztaken');
    const classes = await Classroom.find({ studentsenrolled: studentid }).populate('createdteacher');

    if(!quiz || !student || !classes){
      console.log('quiz or student or classes data not found')
      res.status(404).redirect('/student/login')
    }
    // Render the student's home page with relevant data and flash messages
    res.render('student/studentHome', {
      studentid,
      student,
      classes,
      quiz,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage')
    });
  } catch (error) {
    console.log('An error occurred while fetching data.');
    res.status(500).redirect('/student/login');
  }
});

//------------------------PROFILE SETTINGS------------------------✅

// GET Route to fetch student profile settings
router.get('/studentHome/:studentid/profile/settings',isStudent, async (req, res) => {
  const {studentid} =req.params
  
  try {
      const student = await Student.findOne({ _id: studentid }).populate('quiztaken');
      
      // Check if the student exists
      if (!student) {
          console.log('Student not found for ID:', studentid);
          return res.status(404).redirect(`/student/home/${req.params.studentid}`);
      }

      // Fetch all quizzes
      const quiz = await Quiz.find();
      
      // Render the settings view
      res.render('student/settings', { student, quiz });
  } catch (error) {
      console.error('Error fetching student or quiz data:', error);
      req.flash('errorMessage', 'Error fetching settings. Please try again later.');
      res.status(500).redirect(`/student/home/${req.params.studentid}`);
  }
});

//POST Route to update student profile
router.post('/:studentid/profile/update',isStudent, upload.single('profileimg'), async (req, res) => {
  const { name, email, phone } = req.body; 
  const { studentid } = req.params; 

  try {
      const profileimg = req.file ? `/uploads/${req.file.filename}` : null; // Handle uploaded image

      // Build the update object
      const updateData = { name, email, phone };
      if (profileimg) {
          updateData.profileimg = profileimg; // Add profile image if uploaded
      }

      // Update student profile
      const updatedStudent = await Student.findByIdAndUpdate(studentid, updateData, {
          new: true // Return the updated document
      });

      req.flash('successMessage', 'Profile updated successfully.');
      res.status(200).redirect(`/student/home/${studentid}`);
  } catch (error) {
      req.flash('errorMessage', 'Error updating profile.');
      console.log('Error updating profile',error)
      res.status(500).redirect(`/student/home/${studentid}`);
  }
});

// -------------------------JOIN CLASS----------------------------✅

//POST Route for a student to join a classroom
router.post('/:studentid/class/join',isStudent, async (req, res) => {
  const { studentid } = req.params;
  const { classCode } = req.body; // Class code sent in the request body

  try {
      // Find the classroom by the class code
      const classroom = await Classroom.findOne({ code: classCode });
      const student = await Student.findOne({ _id: studentid });

      console.log(classCode)
      
      // Check if the classroom exists
      if (!classroom) {
          req.flash('errorMessage', 'Class not found. Please check the class code.')
          return res.status(404).redirect(`/student/home/${studentid}`);
      }

      // Check if the student is already enrolled
      if (classroom.studentsenrolled.includes(studentid)) {
          req.flash('errorMessage', 'You are already enrolled in this class.')
          return res.status(400).redirect(`/student/home/${studentid}`);
      }
      
      // Check if the student is already enrolled in the classroom
      if (student.classroomerolled.includes(classroom._id)) {
          req.flash('errorMessage', 'Class is already enrolled.')
          return res.status(400).redirect(`/student/home/${studentid}`);
      }

      // Enroll the student in the classroom
      classroom.studentsenrolled.push(studentid);
      student.classroomerolled.push(classroom._id);
      await classroom.save(); // Save changes to the classroom
      await student.save(); // Save changes to the student

      req.flash('successMessage',`Successfully enrolled to ${classroom.name} class.`)
      return res.status(200).redirect(`/student/home/${studentid}`);
  } catch (error) { 
      req.flash('errorMessage','Server error. Please try again later.')
      console.error('Error enrolling student:', error);
      return res.status(500).redirect(`/student/home/${studentid}`);
  }
});

// ------------------FETCHING ALL MATERIALS OF CLASS-------------✅

// GET Route for fetching materials of the joined class
router.get('/:studentid/enrolled/class/:classroomid',isStudent, async (req, res) => {
  const { studentid, classroomid } = req.params;

  try {
    // Fetch the student and populate the quizzes they have taken
    const student = await Student.findById(studentid).populate('quiztaken');
    if (!student) {
      console.log('Student not found');
      return res.status(404).redirect(`/student/home/${studentid}`);
    }

    // Fetch the materials for the classroom and populate the teacher who uploaded the materials
    const materials = await Material.find({
      classroom: classroomid
    }).populate('teacheruploaded');

    if (!materials) {
      console.log('Material not found');
      return res.status(404);
    }

    // Fetch the classroom by ID and populate the teacher who created the classroom
    const classroom = await Classroom.findById(classroomid)
      .populate('createdteacher')
      .populate('materialsavailable');

    if (!classroom) {
      console.log('Classroom not found');
      req.flash('errorMessage','Class not found')
      return res.status(404).redirect(`/student/home/${studentid}`);
    }

    // Fetch the comments for the classroom and populate the comment creator
    const comments = await Comment.find({ classroom: classroom._id })
      .populate('createdBy');
    
    if (!comments) {
        console.log('Comments not found');
        return res.status(404);
    }

    // Fetch all quizzes (optional if necessary for the view)
    const quiz = await Quiz.find();

    if (!quiz) {
      console.log('quiz not found');
      return res.status(404);
  }

    // Combine materials and comments into one array and mark each with a type
    const allItems = [
      ...materials.map(material => ({
        ...material._doc,
        type: 'material' // Label materials
      })),
      ...comments.map(comment => ({
        ...comment._doc,
        type: 'comment' // Label comments
      }))
    ];

    // Sort the combined array by 'createdAt' in descending order (latest first)
    allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    
    // Render the view 'classesCreated' with all necessary data
    res.render('student/classesCreated', {
      student,
      classroom,
      quiz,
      allItems,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage')
    });

  } catch (error) {
    console.error('Error fetching class data:', error);
    req.flash('errorMessage', 'Error fetching class data');
    res.status(500).redirect(`/student/home/${studentid}`)
  }
});

// --------------FETCHING PERTICULAR MATERIALS DETAILS-------------✅

// GET Route for fetching details of a specific material in a classroom
router.get('/:studentid/enrolled/class/:classroomid/material/:materialid/details',isStudent, async (req, res) => {
  const { studentid, materialid,classroomid } = req.params;  

  try {
    const quiz = await Quiz.find(); 

    // Fetch the student by ID and populate quizzes they have taken
    const student = await Student.findOne({ _id: studentid }).populate('quiztaken');

    // Fetch the material by ID and populate the teacher who uploaded it
    const material = await Material.findOne({ _id: materialid }).populate('teacheruploaded');

    if (!student || !material) {
      // Handle case when student or material is not found
      console.log('Student or Material not found');
      return res.status(404);
    }

    // Render the 'classDetails' view, passing the student, material, and quiz data
    res.render('student/classDetails', { student, material, quiz ,
      successMessage: req.flash('successMessage'),
      errorMessage: req.flash('errorMessage')
    });

  } catch (error) {
    // Catch and handle any errors during database operations or rendering
    console.error('Error fetching material details:', error);
    req.flash('errorMessage', 'Error fetching material details');
    res.status(500).redirect(`/student/${studentid}/enrolled/class/${classroomid}`);
  }
});

// -------------------------COMMENT/SUGGESTION---------------------------✅

// GET Route to display the suggestion page 
router.get('/:studentid/class/suggestion',isStudent, async (req, res) => {
  const { studentid } = req.params;
  try {
    const admin = await Admin.findOne({ name: 'Admin' });
    const quiz = await Quiz.find();
    const student = await Student.findOne({ _id: studentid }).populate('quiztaken');

    if (!admin || !quiz || !student) {
      console.log('Data is missing for admin or quiz or student.');
      return res.status(404);
    }
    // Render the suggestion page with the student, quiz, and admin data
    res.render('student/suggestion', { student, quiz, admin });
  } catch (error) {
    // Handle any errors that occur during database operations
    req.flash('errorMessage','Internal Server Error');
    console.error('Error fetching suggestion data:', error);
    res.status(500).redirect(`/student/home/${studentid}`)
  }
});

//POST Route to Delete comment route
router.post('/:studentid/class/comment/:commentid/delete',isStudent, async (req, res) => {
  const { studentid, commentid} = req.params;

  try {

      const comment = await Comment.findById(commentid).populate('classroom');

      if (!comment || comment.createdBy.toString() !== studentid) {
          req.flash('errorMessage','You are not authorized to delete this comment')
          return res.status(403).redirect(`/student/${studentid}/enrolled/class/${comment.classroom._id}`)
      }

      // Delete the comment
      await Comment.findByIdAndDelete(commentid);

      req.flash('successMessage','Deleting success.')
      // Redirect back to the class page after deletion
      res.redirect(`/student/${studentid}/enrolled/class/${comment.classroom._id}`);
  } catch (error) {
      req.flash('errorMessage','Error in deleting the comment')
      console.error('Error in deleting the comment',error);
      res.status(500).redirect(`/student/home/${studentid}`);
  }
});

//class comment delete
router.post('/comments/:commentId/delete', isStudent, async (req, res) => {
  try {
      const commentId = req.params.commentId;

      // Find the comment by ID
      const comment = await Comment.findById(commentId);

      // Ensure the comment exists and belongs to the current user
      if (!comment || comment.createdBy.toString() !== req.session.student._id.toString()) {
          return res.status(403).json({ message: 'Unauthorized or comment not found' });
      }

      // Delete the comment
      await Comment.findByIdAndDelete(commentId);

      // Redirect back to the page after deletion
      res.redirect('back');
  } catch (error) {
      console.error('Error deleting comment:', error);
      req.flash('errorMessage', 'Error deleting comment');
      res.status(500).redirect(`/student/home/${req.session.student._id}`);
  }
});

//POST Route to handle comment/suggestion creation
router.post('/:studentid/class/comment', isStudent, async (req, res) => {
  const { content, type, targetId } = req.body; // Removed `createdBy` from destructuring as it's derived from studentid
  const { studentid } = req.params;

  try {
    // Create base comment data
    let commentData = {
      content,
      createdBy: studentid,          // Set the creator to the logged-in student
      createdByModel: 'Student',     // Specify that the creator is a Student
      context: type,                 // Context of the comment (e.g., 'classroom', 'teacher', 'admin')
    };

    // Handle different comment contexts
    switch (type) {
      case 'classroom':
        const classroom = await Classroom.findById(targetId);
        if (!classroom) {
          req.flash('errorMessage', 'Classroom not found');
          return res.status(404).redirect(`/student/${studentid}/class/suggestion`);
        }
        commentData.classroom = targetId;  // Attach classroom ID to the comment
        break;

      case 'teacher':
        const teacher = await Teacher.findById(targetId);
        if (!teacher) {
          req.flash('errorMessage', 'Teacher not found');
          return res.status(404).redirect(`/student/${studentid}/class/suggestion`);
        }
        commentData.teacher = targetId;    // Attach teacher ID to the comment
        break;

      case 'admin':
        const admin = await Admin.findById(targetId);
        if (!admin) {
          req.flash('errorMessage', 'Admin not found');
          return res.status(404).redirect(`/student/${studentid}/class/suggestion`);
        }
        commentData.admin = targetId;      // Attach admin ID to the comment
        break;

      default:
        req.flash('errorMessage', 'Invalid context or target.');
        return res.status(400).redirect(`/student/${studentid}/class/suggestion`);
    }

    // Save the new comment to the database
    const newComment = new Comment(commentData);
    await newComment.save();

    // Respond with success message and the new comment
    req.flash('successMessage', 'Message sent successfully');
    res.status(201).redirect(`back`);///student/home/${studentid}
    
  } catch (error) {
    // Handle errors and respond with a 500 status
    console.log('Error adding comment', error);
    req.flash('errorMessage', 'Message not sent.');
    res.status(500).redirect(`/student/home/${studentid}`);
  }
});

//inbox
router.get('/message', isStudent, async (req, res) => {
  try {
    // Fetch all quizzes (you can modify this if you need to filter by some criteria)
    const quiz = await Quiz.find(); 

    // Fetch messages where the context is 'student', createdByModel is 'Teacher' or 'Admin', and the student matches
    const messages = await Comment.find({
      student: req.session.student._id, // Directly match the student object ID
      context: 'student',
      createdByModel: { $in: ['Teacher', 'Admin'] } // Check for both 'Teacher' and 'Admin'
    }).populate('createdBy'); // Populate the 'createdBy' field

    // If no messages found, return 404 with a message
    if (!messages || messages.length === 0) {
      console.log('No messages found');
    }

    // Render the 'student/inbox' view with the messages and student data
    res.render('student/inbox', { 
      messages,
      student: req.session.student,
      quiz
    });
  } catch (error) {
    console.error('Error fetching chat messages', error);
    req.flash('errorMessage', 'Error fetching chat messages');
    // Redirect to the admin panel in case of error (you may want to modify this if the error occurs for students)
    res.status(500).redirect(`/student/home/${req.session.student._id}`);
  }
});


// ---------------------------QUIZ----------------------------✅

//GET route for a student to take a specific quiz
router.get('/:studentid/quiz/:quizid',isStudent, async (req, res) => {
  const { studentid, quizid } = req.params;

  try {
    // Fetch the student by their ID and populate the 'quiztaken' field (assuming quiztaken contains references to Quiz model)
    const student = await Student.findOne({ _id: studentid }).populate('quiztaken');

    // Check if the student exists
    if (!student) {
      console.log('Student not found for ID:', studentid);
      return res.status(404).redirect(`/student/home/${studentid}`)
    }

    // Assuming 'quiztaken' is an array, find the quiz with the matching quizid
    const quizz = student.quiztaken.forEach((q)=>{
      q._id.toString() === quizid
    })

    // Check if the specific quiz is found for the student
    if (quizz) {
      console.log('You already took this quiz.ID:',quizz._id)
      res.status(200).redirect(`/student/home/${studentid}`)
    }

    const quiz=await Quiz.findOne({_id:quizid})

    // Render the 'takeQuiz' view, passing both the student and the quiz data
    res.render('student/takeQuiz', { student, quiz });
  } catch (error) {
  
    // Log the error and return a 500 status code in case of a server error
    req.flash('errorMessage','Error fetching quiz')
    console.error('Error fetching quiz or student:', error);
    res.status(500).redirect(`/student/home/${studentid}`)
  }
});

//POST route for handling the quiz data
router.post('/:studentid/quiz/:quizid/submitQuiz', async (req, res) => {
  const { studentid, quizid } = req.params;

  try {
    const submittedAnswers = req.body.answers; // Extract submitted answers

    // Fetch quiz by id
    const quiz = await Quiz.findById(quizid);
    if (!quiz) {
      console.log('Quiz not found');
      return res.status(404)
    }

    // Fetch the student by id
    const student = await Student.findById(studentid);
    if (!student) {
      console.log('Student not found')
      return res.status(404);
    }

    // Check if the student has already taken the quiz
    const hasTakenQuiz = student.quiztaken.some(q => q.quizId.toString() === quizid);
    if (hasTakenQuiz) {
      req.flash('errorMessage', 'You have already taken this quiz');
      return res.redirect(`/student/${student._id}/class/all/quiz`); // Redirect to the quiz page or some other page
    }

    let score = 0; // Variable to track the score
    let total = 0;

    // Loop through the quiz questions to calculate the score
    quiz.questions.forEach((question) => {
      const correctOptionNumber = question.correctAnswer;
      const submittedAnswer = submittedAnswers[question._id]; // Get submitted answer for the question

      // If the submitted answer is correct, add the score for that question
      if (submittedAnswer === question.options[correctOptionNumber]) {
        score += question.score;
      }

      total += question.score; // Increment the total possible score
    });

    // Update the student model - add quiz details to quiztaken array
    student.quiztaken.push({
      quizId: quiz._id,
      marks: score,
      isTaken: true
    });

    // Update the quiz model - add student details if not already taken
    quiz.studentsTaken.push({
      student: student._id,
      marksObtained: score
    });

    // Save both student and quiz
    await student.save();
    await quiz.save();

    console.log(`Success You scored ${score} out of ${total}`);
    res.render('student/scoreDetails',{
      score,total,quiz,studentid,
    }); // Redirect to the result page or any other page
  } catch (error) {
    console.error('Error submitting quiz:', error);
    req.flash('error', 'An error occurred while submitting the quiz');
    res.status(500).redirect(`/student/class/all/quiz/`);
  }
});

//--------------------------ANNOUNCEMENT-------------------✅

//GET Route to display announcements for a student
router.get('/home/:studentid/announcements',isStudent, async (req, res) => {
  const { studentid } = req.params;

  try {
    const student = await Student.findOne({ _id: studentid });
    const announcement = await Notice.find().populate('createdby');
    const quiz = await Quiz.find();

    // Render the announcements page with the fetched data (student, quizzes, and announcements)
    res.render('student/announcements', { student, quiz, announcement });
  } catch (error) {
    // Log the error and send an error response
    req.flash('errorMessage','Error fetching announcements')
    console.error('Error fetching announcements:', error);
    res.status(500).redirect(`/student/home/${studentid}`);
  }
});

router.get('/:studentid/announcement/:announceid/details',isStudent,async (req,res)=>{
  const { announceid,studentid } = req.params;

  try {
    const quiz = await Quiz.find();
    const student = await Student.findOne({ _id: studentid }).populate('quiztaken');
    // Fetching the specific announcement by ID
    const announcement = await Notice.findById(announceid)
      .populate('createdby', 'name') // Populating teacher's name
      .populate('classroom', 'name'); // Populating classroom name

    if (!announcement) {
      return res.status(404).send('Announcement not found');
    }

    // Rendering the EJS view and passing the announcement data
    res.render('student/announcementsDetails', { announcement,quiz,student });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
})

//--------------------ACHEIVEMENTS-----------------------✅

// GET Route to display class achievements for a student
router.get('/:studentid/class/classachievement', isStudent, async (req, res) => {
  const { studentid } = req.params;

  try {
    const student = await Student.findOne({ _id: studentid }).populate('quiztaken');

    // Check if the student exists
    if (!student) {
      console.log('Student not found for ID:', studentid);
      req.flash('errorMessage', 'Student not found')
      return res.status(404).redirect(`/student/home/${studentid}/`)  // Added response message
    }

    // Fetch all quizzes
    const quiz = await Quiz.find();
    if (!quiz) {
      console.log('Quiz not found');
      req.flash('errorMessage', 'Quiz not found')
      return res.status(404).redirect(`/student/home/${studentid}/`) // Added response message
    }

    // Fetch achievements sorted by createdAt in descending order
    const achievements = await Gallery.find().sort({ createdAt: -1 }); // Sorting by createdAt field
    if (!achievements || achievements.length === 0) {
      console.log('Achievements not found');
      req.flash('errorMessage', 'Achievements not found')
      return res.status(404).redirect(`/student/home/${studentid}/`) // Added response message
    }

    res.render('student/classAchievement', { achievements, student, quiz });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).redirect(`/student/home/${studentid}`);
  }
});


// ----------------------ALLQUIZES---------------------------✅

router.get('/:studentid/class/all/quiz',isStudent, async (req, res) => {
  const {studentid} = req.params;

  try {
    // Fetch the student and populate the quizId inside quiztaken
    const student = await Student.findById(studentid).populate('quiztaken.quizId');
    
    const student1 = await Student.findOne({_id: studentid});
    const quiz=await Quiz.find();
    // Fetch all quizzes
    const quizzes = await Quiz.find({}).populate('createdBy');

    // Map through all quizzes and check if the student has taken them
    const quizzesWithStatus = quizzes.map(quiz => {
      const takenQuiz = student.quiztaken.find(q => q.quizId._id.toString() === quiz._id.toString());
      if (takenQuiz) {
        return {
          quiz,
          isTaken: true,
          marks: takenQuiz.marks
        };
      } else {
        return {
          quiz,
          isTaken: false
        };
      }
    });

    // Render the EJS view with the quizzes and their status
    res.render('student/allQuiz', { 
      quizzes: quizzesWithStatus,
      student:student1,
      quiz 
    });
  } catch (error) {
    console.error(error);
    req.flash('errorMessage','Error in loading quiz')
    res.status(500).redirect(`/student/home/${studentid}`);
  }
});

// ------------------LOGOUT-------------------------✅
// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error logging out:', err);
      req.flash('errorMessage', 'Error logging out. Please try again.');
      return res.redirect(`/student/home/${req.session.student._id}`); //
    }
    res.redirect('/student/login');
  });
});

// -------------------------------------------------------

module.exports = router;





