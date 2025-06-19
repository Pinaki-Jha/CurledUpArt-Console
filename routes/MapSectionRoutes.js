const express = require('express');
const router = express.Router();
const Map = require('../models/MapSection');

// GET the only map (singleton)
router.get('/', async (req, res) => {
  try {
    //console.log("trying to get map")
    const map = await Map.findOne();
    //console.log("got map.sending...")
    //console.log(map)
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
    //console.log("creating and saving map")
    const newMap = new Map({ heading, pins });
    //console.log(newMap)
    await newMap.save();

    //console.log("done")


    res.json(newMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save map' });
  }
});

module.exports = router;
