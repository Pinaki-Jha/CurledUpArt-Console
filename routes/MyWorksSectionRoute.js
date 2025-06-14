const express = require('express');
const router = express.Router();
const multer = require('multer');
const MyWorksSection = require('../models/MyWorksSection');
const cloudinary = require('../config/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const extractPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|webp|gif)/);
  return match ? match[1] : null;
};

// GET route
router.get('/', async (req, res) => {
  try {
    const section = await MyWorksSection.findOne();
    res.json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch works section data.' });
  }
});

// POST route
router.post('/', upload.array('images', 6), async (req, res) => {
  try {
    const { mainHeading } = req.body;
    const headings = JSON.parse(req.body.headings || '[]');
    const imageMetas = JSON.parse(req.body.imageMetas || '[]');
    const files = req.files;

    if (!mainHeading || headings.length !== 6 || imageMetas.length !== 6 || files.length !== 6) {
      return res.status(400).json({ error: 'Missing or invalid data. Expecting 6 headings, 6 imageMetas, and 6 image slots.' });
    }

    const oldSection = await MyWorksSection.findOne();
    const oldImages = oldSection?.works || [];

    const uploadedWorks = await Promise.all(
      imageMetas.map(async (meta, idx) => {
        const heading = headings[idx];
        const file = files[idx];

        if (meta === 'file' && file) {
          // Upload new image
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'my-works-section' },
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          return {
            heading,
            image: result.secure_url,
          };
        } else if (typeof meta === 'string' && meta.startsWith('http')) {
          // Keep old image
          return {
            heading,
            image: meta,
          };
        } else {
          // Empty slot
          return {
            heading,
            image: '',
          };
        }
      })
    );

    const newData = {
      mainHeading,
      works: uploadedWorks,
    };

    const result = await MyWorksSection.findOneAndUpdate({}, newData, {
      upsert: true,
      new: true,
    });

    // Delete only replaced images (i.e., old ones that were not reused)
    const oldImageUrls = oldImages.map((work) => work.image).filter(Boolean);
    const newImageUrls = uploadedWorks.map((work) => work.image).filter(Boolean);
    const deletedImages = oldImageUrls.filter((oldUrl) => !newImageUrls.includes(oldUrl));

    await Promise.all(
      deletedImages.map((url) => {
        const publicId = extractPublicId(url);
        return publicId ? cloudinary.uploader.destroy(publicId) : null;
      })
    );

    res.status(200).json({ message: 'Works section updated successfully!', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update works section.' });
  }
});

module.exports = router;
