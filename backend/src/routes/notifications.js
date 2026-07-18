const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markOneAsRead, deleteNotification } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAsRead);
router.put('/:id/read', authenticate, markOneAsRead);
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
