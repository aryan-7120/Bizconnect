const express = require('express');
const router = express.Router();
const {
  getBusinesses, getBusiness, createBusiness, updateBusiness,
  deleteBusiness, getMyBusiness, updateBlockedDates,
  getAvailableSlots, getSearchSuggestions,
} = require('../controllers/businessController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

/**
 * @swagger
 * /api/businesses:
 *   get:
 *     tags: [Businesses]
 *     summary: Get all approved businesses with filters
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: minRating
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of businesses
 */
router.get('/suggestions', getSearchSuggestions);
router.get('/my', authenticate, authorize('business_owner'), getMyBusiness);
router.get('/:id/slots', getAvailableSlots);
router.put('/:id/blocked-dates', authenticate, authorize('business_owner'), updateBlockedDates);

router.get('/', optionalAuth, getBusinesses);
router.post('/', authenticate, authorize('business_owner'), createBusiness);
router.get('/:id', optionalAuth, getBusiness);
router.put(
  '/:id',
  authenticate,
  authorize('business_owner', 'admin'),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]),
  updateBusiness
);
router.delete('/:id', authenticate, authorize('business_owner', 'admin'), deleteBusiness);

module.exports = router;
