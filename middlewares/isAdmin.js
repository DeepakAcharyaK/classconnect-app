const isAdmin = (req, res, next) => {
    if (req.session && req.session.admin ) {
      next();
    } else {
      res.redirect('/admin/login'); // Redirect to HOD login if not authenticated
    }
};
  
module.exports =isAdmin;
  