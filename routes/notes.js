const mongoose = require('mongoose'); //needed? without this it won't run

//creating a Note model
const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    owner: String,
    category: String,
    createdAt: { type: Date, default: Date.now}
  })
  
  const Note = mongoose.model('Notes', noteSchema);  
