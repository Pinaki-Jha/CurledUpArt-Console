const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const HeroSection = require('../models/HeroSection');


const storage = multer.memoryStorage();
const upload = multer({ storage });

// 👉 GET existing HeroSection data
router.get('/', async (req, res) => {
  try {
    const hero = await HeroSection.findOne();
    res.json(hero);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hero section data.' });
  }
});

router.post('/', upload.array('newImages'), async (req, res) => {
  try {
    const {
      subtitle,
      heading,
      contactbutton,
      myworksbutton,
      existingImages = [],
    } = req.body;

    // Ensure it's always an array
    const parsedExistingImages = Array.isArray(existingImages)
      ? existingImages
      : [existingImages];

    // 🧹 1. Delete removed images from Cloudinary
    const existingHero = await HeroSection.findOne();

    if (existingHero && existingHero.images.length) {
      const toDelete = existingHero.images.filter(
        (url) => !parsedExistingImages.includes(url)
      );

      for (let url of toDelete) {
        const publicId = url
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0];

        await cloudinary.uploader.destroy(publicId);
      }
    }

    // 📤 2. Upload new images properly using Promises
    const uploadedImageUrls = [];

    for (let file of req.files) {
      const uploadedUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'hero-section' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });

      uploadedImageUrls.push(uploadedUrl);
    }

    // 📝 3. Save to DB
    const finalImageSet = [...parsedExistingImages, ...uploadedImageUrls];

    const updatedData = {
      subtitle,
      heading,
      contactbutton,
      myworksbutton,
      images: finalImageSet,
    };

    const result = await HeroSection.findOneAndUpdate({}, updatedData, {
      upsert: true,
      new: true,
    });

    res.status(200).json({
      message: 'Hero section updated successfully',
      data: result,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to update hero section.' });
  }
});


module.exports = router;