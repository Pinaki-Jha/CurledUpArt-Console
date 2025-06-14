const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const ContactSection = require('../models/ContactSection');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 👉 GET existing ContactSection data
router.get('/', async (req, res) => {
  try {
    const contact = await ContactSection.findOne();
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Contact section data.' });
  }
});

// 👉 POST (create or update) ContactSection
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { heading, phone, email, subject, body, social } = req.body;
    const file = req.file;

    // Fetch existing data
    const existing = await ContactSection.findOne();
    let imageUrl = existing?.image || null;

    // 🧹 Delete old image if new one is uploaded
    if (file && imageUrl) {
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`contact-section/${publicId}`);
      imageUrl = null;
    }

    // 📤 Upload new image (if provided)
    if (file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'contact-section' },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    // 📝 Save or update ContactSection
    const updatedData = {
      heading,
      phone,
      email,
      subject,
      body,
      social,
      image: imageUrl,
    };

    const result = await ContactSection.findOneAndUpdate({}, updatedData, {
      upsert: true,
      new: true,
    });

    res.status(200).json({ message: 'Contact section updated successfully', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update Contact section.' });
  }
});

module.exports = router;
