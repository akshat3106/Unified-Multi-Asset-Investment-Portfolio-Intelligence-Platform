require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function main() {
  await connectDB();

  const users = await User.find({}, 'email displayName firebaseUid');
  console.log('List of all users in DB:');
  users.forEach(u => {
    console.log(`- ${u.email} (Name: ${u.displayName}, UID: ${u.firebaseUid})`);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
