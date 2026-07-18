const express = require('express');
const router = express.Router();
const { getFavorites, toggleFavorite, checkFavorite } = require('../controllers/favoriteController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('customer'), getFavorites);
router.post('/toggle', authenticate, authorize('customer'), toggleFavorite);
router.get('/check/:businessId', authenticate, checkFavorite);

module.exports = router;
