const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../services/authService');

router.get('/financial', verifyToken, requireRole('admin', 'manager', 'barber'), reportController.getFinancialReport);

module.exports = router;
