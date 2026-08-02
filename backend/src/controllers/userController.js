const User = require('../models/User');
const Holding = require('../models/Holding');
const MockPortfolioTemplate = require('../models/MockPortfolioTemplate');

// Copies a random mock portfolio template's holdings to a newly registered
// user, since there's no real broker API to pull actual holdings from.
const assignRandomMockPortfolio = async (userId) => {
  const templateCount = await MockPortfolioTemplate.countDocuments();
  if (templateCount === 0) return; // seed script hasn't been run yet — leave user with no holdings

  const randomIndex = Math.floor(Math.random() * templateCount);
  const template = await MockPortfolioTemplate.findOne().skip(randomIndex);
  if (!template) return;

  const holdings = template.holdings.map((h) => ({
    user: userId,
    symbol: h.symbol,
    name: h.name,
    category: h.category,
    exchange: h.exchange,
    quantity: h.quantity,
    avgBuyPrice: h.avgBuyPrice,
  }));

  await Holding.insertMany(holdings);
};

// POST /api/users/sync
// Called after Firebase login. Finds the user by firebaseUid, creating them on first login.
const syncUser = async (req, res) => {
  const { uid, email, name, picture } = req.firebaseUser;

  try {
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        displayName: name,
        photoURL: picture,
      });

      await assignRandomMockPortfolio(user._id);
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync user', error: error.message });
  }
};

module.exports = { syncUser };
