/*const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/UserModel');

async function createUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashedPassword = await bcrypt.hash('Curled@UpArt123456', 10);

  const user = new User({ username: 'vanshika', password: hashedPassword });
  await user.save();
  console.log('User created');
  mongoose.disconnect();
}

createUser();
*/
