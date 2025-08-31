const express = require('express');
const multer = require('multer');
const WorkshopsPage = require('../models/WorkshopsPages');
const cloudinary = require('../config/cloudinary');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const uploadImageToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(fileBuffer);
  });
};

// Utility: extract Cloudinary public_id from URL
function extractPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|webp|gif)/);
  return match?.[1] || null;
}

// GET all sections
router.get('/', async (req, res) => {
  try {
    const doc = await WorkshopsPage.findOne();
    if (!doc) return res.json({ sections: [] });
    res.json({ sections: doc.sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch workshops sections.' });
  }
});

// POST: Replace all sections
router.post('/', upload.array('images'), async (req, res) => {
  try {
    const { sections } = req.body;
    if (!sections) return res.status(400).json({ error: 'Missing sections data.' });

    const parsedSections = JSON.parse(sections);
    const images = req.files || [];
    console.log(sections)
    // Step 1: Fetch existing image URLs and public_ids from DB
    const existingDoc = await WorkshopsPage.findOne();
    const oldImageUrls = [];
    if (existingDoc) {
      for (const sec of existingDoc.sections) {
        for (const item of sec.items) {
          if (item.type === 'image' && item.url) {
            oldImageUrls.push(item.url);
          }
        }
      }
    }

    let imageIndex = 0;
    const usedImageUrls = [];

    // Step 2: Upload new images & track used image URLs
    for (const section of parsedSections) {
      for (const item of section.items) {
        if (item.type === 'image') {
          if (item.url && typeof item.url === 'string') {
            // Already uploaded image
            usedImageUrls.push(item.url);
          } else {
            const file = images[imageIndex++];
            if (!file) continue;

            const result = await uploadImageToCloudinary(file.buffer, 'workshops-page');
            item.url = result.secure_url;
            usedImageUrls.push(result.secure_url);
          }
        }
      }
    }

    // Step 3: Identify deleted images
    const deletedUrls = oldImageUrls.filter(url => !usedImageUrls.includes(url));
    const toDeletePublicIds = deletedUrls.map(extractPublicId).filter(Boolean);

    await Promise.all(toDeletePublicIds.map(pid => cloudinary.uploader.destroy(pid)));

    // Step 4: Save new doc
    await WorkshopsPage.deleteMany({});
    const savedDoc = await WorkshopsPage.create({ sections: parsedSections });

    res.json(savedDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save workshops sections.' });
  }
});

module.exports = router;
