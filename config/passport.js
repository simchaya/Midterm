const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    // In a real app, you would find or create a user in your database
    // For this demo, we'll just use the profile info
    // Mongoose DB interactions
    return done(null,profile);
  }
));

// To match the user with sessions
passport.serializeUser((userId, done) => {
  console.log("Serialized")//for test to see when this will be called (it supposed to create a new logging session)
  done(null, userId);
});

// Retrieve user data from session
passport.deserializeUser((user, done) => {
  console.log("Deserialized")//for test to see when this will be called (only if you move to another page)
  done(null, user);
});