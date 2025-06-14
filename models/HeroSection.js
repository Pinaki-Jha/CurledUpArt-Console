const mongoose = require('mongoose');

const heroSectionSchema = new mongoose.Schema({
  subtitle: String,
  heading: String,
  contactbutton: String,
  myworksbutton: String,
  images: [String], // Array of Cloudinary image URLs
});

module.exports = mongoose.model('HeroSection', heroSectionSchema);
