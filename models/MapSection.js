// models/Pin.js
const mongoose = require('mongoose');

const pinSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

// models/Map.js
const mapSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  pins: [pinSchema],
});

module.exports = mongoose.model('Map', mapSchema);
