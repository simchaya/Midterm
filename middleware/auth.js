// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  //console.log('User session:', req.user); // Debug: Check user session
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }

  module.exports = { isLoggedIn }; //to avoid overwriting the exports of app.js