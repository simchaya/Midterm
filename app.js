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
    const notes = await Note.find({ owner: req.user.id }); // Fetch notes for logged-in user
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
      owner: req.user.id, // this is a string
      category,
    });

    // Save the note to the database
    await newNote.save();

    res.redirect('./notes');

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

//task 5 edit and delete

app.get('/notes/:id/edit', isLoggedIn, async (req, res) => {
  try {
    const noteId = req.params.id;

    // Fetch the specific note by ID
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).send('Note not found');
    }

    // Render an edit form with the note data
    res.render('edit', { note, user: req.user });

  } catch (error) {
    console.error('Error fetching note for edit:', error);

    if (error.name === 'CastError') {
      return res.status(400).send('Invalid note ID format');
    }

    res.status(500).send('Failed to fetch note');
  }
});

const methodOverride = require('method-override');
app.use(methodOverride('_method')); // To support PUT and DELETE requests via forms


app.put('/notes/:id', isLoggedIn, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, category } = req.body;

    // Find the note by ID and update it
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { title, content, category },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedNote) {
      return res.status(404).send('Note not found');
    }

    // Redirect to the updated note's page or notes list
    res.redirect('/notes');
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).send('Failed to update note');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the app`);
});


