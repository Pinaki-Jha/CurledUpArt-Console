const mongoose = require('mongoose');

const workshopsSectionSchema = new mongoose.Schema({
  heading: String,
  buttontext: String,
  description: String,
  images: [String], // Array of Cloudinary image URLs
});

module.exports = mongoose.model('WorkshopsSection', workshopsSectionSchema);
