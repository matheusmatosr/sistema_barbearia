const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyToken, requireRole } = require('../services/authService');

router.post('/register', clientController.registerClient);
router.get('/', verifyToken, requireRole('admin', 'manager'), clientController.getClients);
router.delete('/:id', verifyToken, requireRole('admin'), clientController.deleteClient);
router.put('/:id', verifyToken, requireRole('admin'), clientController.updateClient);

module.exports = router;
