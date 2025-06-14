const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const AboutSection = require('../models/AboutSection');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 👉 GET existing AboutSection data
router.get('/', async (req, res) => {
  try {
    const about = await AboutSection.findOne();
    res.json(about);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch About section data.' });
  }
});

// 👉 POST (create or update) AboutSection
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, paragraph } = req.body;
    const file = req.file;

    // Fetch existing About section
    const existing = await AboutSection.findOne();
    let imageUrl = existing?.image || null;

    // 🧹 Delete old image from Cloudinary if new one is uploaded
    if (file && imageUrl) {
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`about-section/${publicId}`);
      imageUrl = null;
    }

    // 📤 Upload new image (if provided)
    if (file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'about-section' },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    // 📝 Save to MongoDB
    const updatedData = {
      title,
      paragraph,
      image: imageUrl,
    };

    const result = await AboutSection.findOneAndUpdate({}, updatedData, {
      upsert: true,
      new: true,
    });

    res.status(200).json({ message: 'About section updated successfully', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update About section.' });
  }
});

module.exports = router;
