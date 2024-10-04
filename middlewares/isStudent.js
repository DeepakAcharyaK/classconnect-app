const isStudent = (req, res, next) => {
    if (req.session && req.session.student ) {
      next();
    } else {
      res.redirect('/student/login'); // Redirect to HOD login if not authenticated
    }
};
  
module.exports =isStudent
  