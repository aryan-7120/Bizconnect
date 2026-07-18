const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
