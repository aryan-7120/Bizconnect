const express = require('express');
const router = express.Router();
const { getServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getServices);
router.post('/', authenticate, authorize('business_owner'), createService);
router.put('/:id', authenticate, authorize('business_owner'), updateService);
router.delete('/:id', authenticate, authorize('business_owner', 'admin'), deleteService);

module.exports = router;
