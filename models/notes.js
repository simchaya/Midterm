
const mongoose = require('mongoose');

//creating a Note model
const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
  owner: String, // just a string, store Google user ID here
  category: String,
  createdAt: { type: Date, default: Date.now },
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;

