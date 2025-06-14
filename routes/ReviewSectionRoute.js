const express = require('express');
const router = express.Router();
const ReviewSection = require('../models/ReviewSection');

// GET existing ReviewSection
router.get('/', async (req, res) => {
  try {
    const data = await ReviewSection.findOne();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Review section.' });
  }
});

// POST or Update ReviewSection
router.post('/', async (req, res) => {
  try {
    const { heading, links } = req.body;

    const updated = await ReviewSection.findOneAndUpdate(
      {},
      { heading, links },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Review section updated successfully', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update Review section.' });
  }
});

module.exports = router;
