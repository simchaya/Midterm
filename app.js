const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const mongoose = require('mongoose'); 
require('dotenv').config();
require('./config/passport');

const app = express();

app.set('view engine', 'ejs');
// if you delete this line, it will default to 'views' folder
app.set('views', path.join(__dirname, 'views')); 

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', require('./routes/auth'));
//app.use('/notes', require('./routes/notes'));

app.get('/', (req, res) => {
  res.render('login', { user: req.user });
});

app.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { user: req.user });
});

//Create routes

app.get('/notes', isLoggedIn, async (req, res) => {
    // Gets all noted for the current logged in user
    res.send("hello")
  
  })

app.post('/notes', isLoggedIn, async (req, res) => {
  try {
    // Create a new note (hardcoded for test)
    //next step: create a button to create a note in the ejs
    const myNote = new Note({
      title: "To finish today",
      content: "make food for tomorrow",
      owner: req.user.id, // Assuming the logged-in user is accessible via `req.user`
      category: "ToDo",
    });

    // Save the note to the database
    await myNote.save();

    // Send a success response
    res.status(201).json({ message: "Note created successfully", note: myNote });
  } catch (err) {
    // Handle any errors
    res.status(500).json({ message: "Failed to create note", error: err.message });
  }
});


/*app.get('/:id', isLoggedIn, async (req, res) => {
  // Get a specific note


})*/


// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the app`);
});

//connect to MongoDB
mongoose.connect("mongodb+srv://simchacb:JmRkdLn7EMrYaAQ5@simchacb.alvmivf.mongodb.net/")
