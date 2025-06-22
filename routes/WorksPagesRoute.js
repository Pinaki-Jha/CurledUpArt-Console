const express = require('express');
const multer = require('multer');
const WorksPageSection = require('../models/WorksPages');
const cloudinary = require('../config/cloudinary');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

function extractPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|webp|gif)/);
  return match?.[1] || null;
}

//GET all sections
router.get('/', async (req, res) => {
  try {
    const sections = await WorksPageSection.find().sort({ createdAt: 1 });
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sections.' });
  }
});

router.post('/', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images' }
]), async (req, res) => {
  try {
    const { heading, description, description2 } = req.body;
    if (!heading) return res.status(400).json({ error: 'Heading is required.' });

    const section = new WorksPageSection({ heading, description, description2 });
    const id = section._id.toString();

    // Upload main image
    if (req.files.mainImage?.[0]) {
      const mainRes = await new Promise((r, j) => {
        const stream = cloudinary.uploader.upload_stream({ folder: `works-page/${id}/main` }, (err, result) =>
          err ? j(err) : r(result)
        );
        stream.end(req.files.mainImage[0].buffer);
      });
      section.mainImage = { url: mainRes.secure_url, public_id: mainRes.public_id };
    }

    // Upload additional images
    if (req.files.images) {
      section.images = await Promise.all(req.files.images.map((file, idx) => {
        
        return new Promise((r, j) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: `works-page/${id}/additional` },
            (err, result) => err ? j(err) : r({
              url: result.secure_url,
              public_id: result.public_id,
              title: req.body['newImages'][idx]['title'] || '',
              description: req.body['newImages'][idx]['description'] || ''
            })
          );
          stream.end(file.buffer);
        });
      }));
    }

    const saved = await section.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create section.' });
  }
});

//PUT: Update existing section
router.put('/:id', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'images' }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await WorksPageSection.findById(id);
    if (!existing) return res.status(404).json({ error: 'Section not found.' });

    //console.log(req.body);

    const {
      heading,
      description,
      description2,
      existingImages = '[]',
      existingImagesMetadata = '[]'  // ← Added
    } = req.body;

    //console.log(req.body)
    //console.log("existingImagesMetadata:",existingImagesMetadata)
    existing.heading = heading || existing.heading;
    existing.description = description;
    existing.description2 = description2;

    const retained = JSON.parse(existingImages);
    //console.log(req.body)
    const existingMetadata = Array.isArray(existingImagesMetadata)
      ? existingImagesMetadata.map(meta => typeof meta === 'string' ? JSON.parse(meta) : meta)
      : Object.entries(req.body)
          .filter(([key]) => key.includes('existingImagesMetadata'))
          .reduce((acc,[key,value] ) => {
            const match = key.match(/existingImagesMetadata\[(\d+)\]\[([^\]]+)\]/);
            if (match) {
              const index = parseInt(match[1]);
              const field = match[2];
              acc[index] = acc[index] || { title: '', description: '', url: '' };
              acc[index][field] = value;
            }
            return acc;
          }, []);

    // Delete removed images
    existing.images = existing.images.filter(img => {
      if (!retained.includes(img.url)) {
        cloudinary.uploader.destroy(img.public_id);
        return false;
      }
      return true;
    });

    // ✅ Update metadata of retained images
    for (const meta of existingMetadata) {
      const imgToUpdate = existing.images.find(img => img.url === meta.url);
      if (imgToUpdate) {
        imgToUpdate.title = meta.title || '';
        imgToUpdate.description = meta.description || '';
      }
    }

    //console.log(existingMetadata.length)
    existing.images = existingMetadata
    .map(meta => existing.images.find(img => img.url === meta.url))
    .filter(Boolean);

    // Upload new additional images
    if (req.files.images) {
      //console.log(req.body)
      const newImages = await Promise.all(req.files.images.map((file, idx) => {
        const lengthBuffer = existingMetadata.length;
        //console.log(req.body['newImages'][idx+lengthBuffer])

          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: `works-page/${id}/additional` },
              (err, result) => err ? reject(err) : resolve({
                url: result.secure_url,
                public_id: result.public_id,
                title: req.body?.['newImages']?.[idx+lengthBuffer]?.['title'] || '',
                description: req.body?.['newImages']?.[idx+lengthBuffer]?.['description'] || ''
              })
            );
            stream.end(file.buffer);
          });
        
        
      }));
      existing.images.push(...newImages);
    }

    // Upload new main image
    if (req.files.mainImage) {
      if (existing.mainImage.public_id) {
        await cloudinary.uploader.destroy(existing.mainImage.public_id);
      }
      const mainRes = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `works-page/${id}/main` },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.files.mainImage[0].buffer);
      });
      existing.mainImage = {
        url: mainRes.secure_url,
        public_id: mainRes.public_id
      };
    }

    const updated = await existing.save();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update section.' });
  }
});


// DELETE: Remove a section entirely
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const section = await WorksPageSection.findByIdAndDelete(id);
    if (!section) return res.status(404).json({ error: 'Section not found.' });
    //console.log(section)
    const toDelete = [section.mainImage.public_id, ...section.images.map((img) => {if(img){return img.public_id}})]
      .filter(Boolean);
    await Promise.all(toDelete.map((pid) => cloudinary.uploader.destroy(pid)));

    res.json({ message: 'Section deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete section.' });
  }
});

module.exports = router;
 