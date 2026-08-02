const express = require('express');
const { analyzePortfolio } = require('../controllers/portfolioAnalysisController');

const router = express.Router();

router.post('/', analyzePortfolio);

module.exports = router;
