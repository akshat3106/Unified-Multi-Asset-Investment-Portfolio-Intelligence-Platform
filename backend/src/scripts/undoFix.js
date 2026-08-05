require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Holding = require('../models/Holding');
const MockPortfolioTemplate = require('../models/MockPortfolioTemplate');

async function main() {
  await connectDB();

  // 1. Delete holdings we assigned to swastikneo7acc@gmail.com
  const user = await User.findOne({ email: 'swastikneo7acc@gmail.com' });
  if (user) {
    const deleteHoldingsResult = await Holding.deleteMany({ user: user._id });
    console.log(`Deleted ${deleteHoldingsResult.deletedCount} holdings for user swastikneo7acc@gmail.com`);
  } else {
    console.log('User swastikneo7acc@gmail.com not found.');
  }

  // 2. Delete the seeded mock portfolio templates
  const deleteTemplatesResult = await MockPortfolioTemplate.deleteMany({});
  console.log(`Deleted ${deleteTemplatesResult.deletedCount} mock portfolio templates.`);

  console.log('Undo complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
