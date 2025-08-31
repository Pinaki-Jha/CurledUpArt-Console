const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  url: String,
  public_id: String,
  title: String,
  description: String,
  type:String
}, { _id: false });

const WorksPageSectionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  order :{type:Number,default:10000},
  description: { type: String, default: '' },
  description2: { type: String, default: '' },
  mainImage: {
    url: String,
    public_id: String
  },
  images: [ImageSchema]
}, { timestamps: true });

module.exports = mongoose.model('WorksPageSection', WorksPageSectionSchema); 