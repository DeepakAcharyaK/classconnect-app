// middleware/auth.js
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    } else {
      req.flash('error', 'You need to log in first');
      return res.redirect('/student/login');
    }
  }
  
  module.exports = isAuthenticated;
  
  
  