const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
require('./config/passport');
const Note = require('./models/notes');
const { isLoggedIn } = require('./middleware/auth')
const app = express();

mongoose.connect('mongodb+srv://simchacb:JmRkdLn7EMrYaAQ5@simchacb.alvmivf.mongodb.net/test', {
})
  .then(() => console.log('Connected successfully to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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
  try {
    const notes = await Note.find({ owner: req.user._id }); // Fetch notes for logged-in user
    //console.log('Fetched notes:', notes); // Debug log
    res.render('index', { notes, user: req.user }); // Render the index view with notes
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/notes', isLoggedIn, async (req, res) => {
  try {
    // Create a new note  
    const { title, content, category } = req.body;
    const newNote = new Note({
      title,
      content,
      category,
      //owner: req.user.id, // Assuming the logged-in user is accessible via `req.user`     
    });

    // Save the note to the database
    await newNote.save();

    // Send a success response
    //res.status(201).json({ message: "Note created successfully", note: newNote });
    res.redirect('./notes');
    //debug print
    //console.log(newNote);
  } catch (err) {
    // Handle any errors
    res.status(500).json({ message: "Failed to create note", error: err.message });
  }
});

app.get('/notes/:id', isLoggedIn, async (req, res) => {
  try {
    const noteId = req.params.id;

    // Fetch the specific note by ID
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).send('Note not found');
    }

    res.render('note', { note });
  } catch (error) {
    console.error('Error fetching note:', error);

    if (error.name === 'CastError') {
      return res.status(400).send('Invalid note ID format');
    }

    res.status(500).send('Failed to fetch note');
  }
});



app.get('/:id', isLoggedIn, async (req, res) => {
  // Get a specific note
  try {
    const noteId = req.params.id;

    // Fetch the specific note by ID
    const note = await Note.findById(noteId);

    // Check if the note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Respond with the note
    res.status(200).json(note);
  } catch (error) {
    console.error('Error fetching note:', error);

    // Handle invalid ObjectId error
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }

    // Send a generic error response
    res.status(500).json({ message: 'Failed to fetch note', error: error.message });
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the app`);
});


