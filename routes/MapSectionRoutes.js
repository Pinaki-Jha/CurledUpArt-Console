const express = require('express');
const router = express.Router();
const Map = require('../models/MapSection');

// GET the only map (singleton)
router.get('/', async (req, res) => {
  try {
    const map = await Map.findOne();
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch map' });
  }
});

// POST: replace the map with a new one
router.post('/', async (req, res) => {
  const { heading, pins } = req.body;

  try {
    // Delete existing map (singleton design)
    await Map.deleteMany({});

    // Create a new one
    const newMap = new Map({ heading, pins });
    await newMap.save();

    res.json(newMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save map' });
  }
});

module.exports = router;
