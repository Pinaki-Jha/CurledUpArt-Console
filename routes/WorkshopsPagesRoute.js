const express = require('express');
const router = express.Router();
const WorkshopsPage = require('../models/WorkshopsPages');

// 👉 GET all workshop sections
router.get('/', async (req, res) => {
  try {
    const page = await WorkshopsPage.findOne();
    res.json(page || { sections: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workshops page' });
  }
});

// 👉 POST to update all sections (overwrite style)
router.post('/', async (req, res) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const updated = await WorkshopsPage.findOneAndUpdate(
      {},
      { sections },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Workshops page updated', data: updated });
  } catch (err) {
    console.error('POST /api/workshops-page error:', err);
    res.status(500).json({ error: 'Failed to update workshops page' });
  }
});

module.exports = router;
