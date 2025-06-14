// models/MyWorksSection.js
const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  image: { type: String, required: true },
});

const myWorksSectionSchema = new mongoose.Schema({
  mainHeading: { type: String, required: true },
  works: [workSchema], // Array of 6 works
});

module.exports = mongoose.model('MyWorksSection', myWorksSectionSchema);
