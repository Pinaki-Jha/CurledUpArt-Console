const mongoose = require('mongoose');

const ReviewSectionSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
  },
  links: {
    type: [String],
    required: true,
  }
});

module.exports = mongoose.model('ReviewSection', ReviewSectionSchema);
