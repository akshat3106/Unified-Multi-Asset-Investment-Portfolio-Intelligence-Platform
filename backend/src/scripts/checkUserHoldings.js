require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Holding = require('../models/Holding');

async function main() {
  await connectDB();

  const user = await User.findOne({ email: 'akshatjha3125@gmail.com' });
  if (!user) {
    console.log('User akshatjha3125@gmail.com not found in the database.');
  } else {
    console.log(`User found: ${user.email} (${user._id})`);
    const holdings = await Holding.find({ user: user._id });
    console.log(`Holdings count: ${holdings.length}`);
    holdings.forEach(h => {
      console.log(`- ${h.symbol}: qty=${h.quantity}, avgBuyPrice=${h.avgBuyPrice}`);
    });
  }

  await mongoose.disconnect();
}

main().catch(console.error);
