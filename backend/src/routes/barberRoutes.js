const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const { verifyToken, requireRole } = require('../services/authService');

// A lista pública de cada barbearia vem de GET /api/barbershops/:slug; esta é a do painel.
router.use(verifyToken, requireRole('admin', 'manager'));
router.get('/', barberController.getBarbers);
router.post('/', barberController.createBarber);
router.delete('/:id', barberController.deleteBarber);
router.put('/:id', barberController.updateBarber);

module.exports = router;
