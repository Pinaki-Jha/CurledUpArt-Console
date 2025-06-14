const mongoose = require('mongoose');

const AboutSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  paragraph: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Cloudinary URL
    required: false,
  }
});

module.exports = mongoose.model('AboutSection', AboutSectionSchema);
