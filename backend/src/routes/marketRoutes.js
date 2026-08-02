const express = require('express');
const { searchMarket, getQuote, getChart, getIndices, getMutualFundCatalog, getEquityCatalog, getGoldCatalog } = require('../controllers/marketController');

const router = express.Router();

router.get('/search', searchMarket);
router.get('/indices', getIndices);
router.get('/mutual-funds/catalog', getMutualFundCatalog);
router.get('/equities/catalog', getEquityCatalog);
router.get('/gold/catalog', getGoldCatalog);
router.get('/quote/:symbol', getQuote);
router.get('/chart/:symbol', getChart);

module.exports = router;
