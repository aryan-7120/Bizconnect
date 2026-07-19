const express = require('express');
const router = express.Router();
const { createReview, getBusinessReviews, getMyReviews, updateReview, deleteReview, addOwnerReply, syncAllRatings } = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, getMyReviews);
router.get('/business/:businessId', getBusinessReviews);
router.post('/', authenticate, authorize('customer'), createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.put('/:id/reply', authenticate, authorize('business_owner'), addOwnerReply);
router.post('/sync-ratings', authenticate, syncAllRatings);

module.exports = router;
