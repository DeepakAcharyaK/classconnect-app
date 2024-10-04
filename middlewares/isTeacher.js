const isTeacher = (req, res, next) => {
  if (req.session && req.session.teacher ) {
    next();
  } else {
    res.redirect('/teacher/login'); // Redirect to HOD login if not authenticated
  }
};

module.exports =isTeacher
