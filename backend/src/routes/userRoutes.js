const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { syncUser, deleteAccount } = require('../controllers/userController');

const router = express.Router();

router.post('/sync', authMiddleware, syncUser);
router.delete('/me', authMiddleware, deleteAccount);

module.exports = router;
