const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, requireRole } = require('../services/authService');

router.use(verifyToken);
router.post('/', requireRole('client'), appointmentController.createAppointment);
router.get('/availability', appointmentController.getAvailability);
router.get('/', appointmentController.getAppointments);
router.delete('/:id', appointmentController.cancelAppointment);
router.put('/:id/reschedule', requireRole('client'), appointmentController.rescheduleAppointment);
router.put('/:id', appointmentController.updateAppointment);

module.exports = router;