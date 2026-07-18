const express = require('express');
const router = express.Router();
const {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusiness,
  updateBlockedDates,
  getAvailableSlots,
  getSearchSuggestions,
  getBusinessAnalytics,
} = require('../controllers/businessController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

/**
 * @swagger
 * /api/businesses:
 *   get:
 *     tags: [Businesses]
 *     summary: Get all approved businesses with filters & pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search across name, description, tags
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Filter by category ObjectId
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: minRating
 *         schema: { type: number }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [recent, rating] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Paginated list of businesses
 */

// --- Specific named routes BEFORE /:id to avoid conflicts ---
router.get('/suggestions', getSearchSuggestions);
router.get('/my', authenticate, authorize('business_owner'), getMyBusiness);
router.get('/analytics', authenticate, authorize('business_owner'), getBusinessAnalytics);

// --- Parameterized routes ---
router.get('/:id/slots', getAvailableSlots);
router.put('/:id/blocked-dates', authenticate, authorize('business_owner'), updateBlockedDates);

// --- Collection routes ---
router.get('/', optionalAuth, getBusinesses);
router.post('/', authenticate, authorize('business_owner'), createBusiness);

// --- Single resource routes ---
router.get('/:id', optionalAuth, getBusiness);
router.put(
  '/:id',
  authenticate,
  authorize('business_owner'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
  ]),
  updateBusiness
);
router.delete('/:id', authenticate, authorize('business_owner'), deleteBusiness);

module.exports = router;
