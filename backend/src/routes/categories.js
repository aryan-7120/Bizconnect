const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

// Categories are public to read; create/update/delete only by business_owner
// (In a future admin panel these could be restricted further)
router.get('/', getCategories);
router.post('/', authenticate, authorize('business_owner'), createCategory);
router.put('/:id', authenticate, authorize('business_owner'), updateCategory);
router.delete('/:id', authenticate, authorize('business_owner'), deleteCategory);

module.exports = router;
