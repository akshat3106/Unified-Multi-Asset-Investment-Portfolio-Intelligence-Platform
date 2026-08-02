const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getHoldings, getPerformance } = require('../controllers/portfolioController');

const router = express.Router();

router.get('/holdings', authMiddleware, getHoldings);
router.get('/performance', authMiddleware, getPerformance);

module.exports = router;
