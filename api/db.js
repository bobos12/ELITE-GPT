const mongoose = require('mongoose');

let hasConnected = false;

async function connectDb() {
  if (hasConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment.');
  }

  await mongoose.connect(uri, {
    autoIndex: true
  });
  hasConnected = true;
}

module.exports = { connectDb };

