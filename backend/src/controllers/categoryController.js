const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, data: categories });
};

exports.createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  res.json({ success: true, data: category });
};

exports.deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
  res.json({ success: true, message: 'Category deleted.' });
};
