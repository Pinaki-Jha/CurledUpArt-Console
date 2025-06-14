const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
dotenv.config();

const heroRoutes = require('./routes/HeroSectionRoute');
const aboutRoutes = require('./routes/AboutSectionRoute');
const myWorksRoutes = require('./routes/MyWorksSectionRoute')
const contactRoutes = require('./routes/ContactSectionRoute')
const worksPagesRoutes = require('./routes/WorksPagesRoute')
const reviewRoutes = require('./routes/ReviewSectionRoute')
const workshopRoutes = require('./routes/WorkshopSectionRoute')
const workshopsPagesRoutes = require('./routes/WorkshopsPagesRoute')
const mapSectionRoutes = require('./routes/MapSectionRoutes')
const authRoutes = require('./routes/AuthRoutes')


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.use('/api/herosec', heroRoutes);
app.use('/api/aboutsec',aboutRoutes);
app.use('/api/myworksec',myWorksRoutes);
app.use('/api/works-pages', worksPagesRoutes);
app.use('/api/contactsec',contactRoutes)
app.use('/api/reviewsec',reviewRoutes)
app.use('/api/workshopsec',workshopRoutes)
app.use('/api/workshops-pages',workshopsPagesRoutes)
app.use('/api/mapsec',mapSectionRoutes)

app.use('/api/auth', authRoutes);

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});




const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
