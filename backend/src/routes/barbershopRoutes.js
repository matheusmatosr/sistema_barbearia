const express = require('express');
const router = express.Router();
const barbershopController = require('../controllers/barbershopController');
const { verifyToken, requireRole } = require('../services/authService');

router.get('/', barbershopController.listShops);
router.get('/manage', verifyToken, requireRole('admin', 'manager'), barbershopController.listManagedShops);
router.post('/', verifyToken, requireRole('admin'), barbershopController.createShop);
router.put('/:id', verifyToken, requireRole('admin', 'manager'), barbershopController.updateShop);
router.delete('/:id', verifyToken, requireRole('admin'), barbershopController.deleteShop);
router.post('/:id/managers', verifyToken, requireRole('admin'), barbershopController.createManager);
router.delete('/:id/managers/:managerId', verifyToken, requireRole('admin'), barbershopController.deleteManager);
router.get('/:key', barbershopController.getShop);

module.exports = router;
