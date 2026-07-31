const express = require('express');
const { getAuditLog } = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', getAuditLog);

module.exports = router;
