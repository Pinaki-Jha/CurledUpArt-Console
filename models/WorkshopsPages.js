const mongoose = require('mongoose');

const workshopSectionSchema = new mongoose.Schema({
  heading: String,
  description: String,
  items: [
    { type: { type:String },
      url: String, 
    },
  ]
});

const WorkshopsPageSchema = new mongoose.Schema({
  sections: [workshopSectionSchema],
});

module.exports = mongoose.model('WorkshopsPage', WorkshopsPageSchema);
