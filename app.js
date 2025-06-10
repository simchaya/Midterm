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

//connect to MongoDB (task 1)
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

//merged get('/notes'...) route for getting all notes for current user (task 2 & 3) and filter notes list by category (task 6)

app.get('/notes', isLoggedIn, async (req, res) => {
  try {
    const { category } = req.query; // Get category from query string
    const filter = { owner: req.user.id }; // Default filter

    if (category) {
      filter.category = category; // Add category filter if provided
    }

    const notes = await Note.find(filter); // Fetch filtered or all notes
    const categories = await Note.distinct('category', { owner: req.user.id }); // Get distinct categories

    res.render('index', {
      notes,
      categories,
      user: req.user,
      selectedCategory: category || ''
    });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Create a new note (task 2 & 3)
app.post('/notes', isLoggedIn, async (req, res) => {
  try {

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

// Get a specific note by ID (task 2 & 3)
app.get('/notes/:id', isLoggedIn, async (req, res) => {
  try {
    const noteId = req.params.id;

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

//Edit a note (task 4)
app.get('/notes/:id/edit', isLoggedIn, async (req, res) => {
  try {
    const noteId = req.params.id;

    // Fetch a specific note by ID
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

//Edit a note (task 4)
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

//Delete a note (task 4)
app.delete('/notes/:id', isLoggedIn, async (req, res) => {
  try {
    const noteId = req.params.id;

    // Make sure the logged-in user owns the note before deleting
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).send('Note not found');
    }
    if (note.owner.toString() !== req.user.id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    await Note.findByIdAndDelete(noteId);
    res.redirect('/notes');
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).send('Internal Server Error');
  }
});

// API endpoint to get all notes in JSON format (task 5)
app.get('/api/notes', isLoggedIn, async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.id });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// API endpoint to create a note via JSON (task 5)
app.post('/api/notes', isLoggedIn, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const newNote = new Note({
      title,
      content,
      owner: req.user.id,
      category,
    });

    await newNote.save();

    res.status(201).json({ message: 'Note created successfully', note: newNote });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the app`);
});


