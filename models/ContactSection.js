const mongoose = require('mongoose');

const ContactSectionSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: false,
  },
  body: {
    type: String,
    required: false,
  },
  social: {
    type: String,
    required: false,
  },
  image: {
    type: String, // Cloudinary URL
    required: false,
  }
});

module.exports = mongoose.model('ContactSection', ContactSectionSchema);
