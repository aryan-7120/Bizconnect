const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, getAppointment, updateStatus } = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('customer'), bookAppointment);
router.get('/', authenticate, getAppointments);
router.get('/:id', authenticate, getAppointment);
router.put('/:id/status', authenticate, updateStatus);

module.exports = router;
