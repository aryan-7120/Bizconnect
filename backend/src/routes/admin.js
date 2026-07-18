const express = require('express');
const router = express.Router();
const { getUsers, toggleSuspend, approveBusiness, getPlatformAnalytics, getBusinessAnalytics } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin routes
router.get('/users', authenticate, authorize('admin'), getUsers);
router.put('/users/:id/suspend', authenticate, authorize('admin'), toggleSuspend);
router.put('/businesses/:id/approve', authenticate, authorize('admin'), approveBusiness);
router.get('/analytics/platform', authenticate, authorize('admin'), getPlatformAnalytics);

// Business owner analytics
router.get('/analytics/business', authenticate, authorize('business_owner'), getBusinessAnalytics);

module.exports = router;
