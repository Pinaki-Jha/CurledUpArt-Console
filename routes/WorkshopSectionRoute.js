const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const WorkshopsSection = require('../models/WorkshopSection');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 👉 GET existing Workshops Section data
router.get('/', async (req, res) => {
  try {
    const section = await WorkshopsSection.findOne();
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workshops section data.' });
  }
});

// 👉 POST or UPDATE Workshops Section
router.post('/', upload.array('newImages'), async (req, res) => {
  try {
    const {
      heading,
      buttontext,
      description,
      existingImages = [],
    } = req.body;
    //console.log(req.body)
    const parsedExistingImages = Array.isArray(existingImages)
      ? existingImages
      : [existingImages];

    const existingSection = await WorkshopsSection.findOne();

    // 🧹 Delete removed images from Cloudinary
    if (existingSection && existingSection.images.length) {
      const toDelete = existingSection.images.filter(
        (url) => !parsedExistingImages.includes(url)
      );

      for (let url of toDelete) {
        const publicId = url.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // 📤 Upload new images
    const uploadedImageUrls = [];

    for (let file of req.files) {
      const uploadedUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'workshops-section' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });

      uploadedImageUrls.push(uploadedUrl);
    }

    // 📝 Final DB payload
    const finalImageSet = [...parsedExistingImages, ...uploadedImageUrls];

    const updatedData = {
      heading,
      buttontext,
      description,
      images: finalImageSet,
    };

    const result = await WorkshopsSection.findOneAndUpdate({}, updatedData, {
      upsert: true,
      new: true,
    });

    res.status(200).json({
      message: 'Workshops section updated successfully',
      data: result,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to update workshops section.' });
  }
});

module.exports = router;
