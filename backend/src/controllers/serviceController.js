const Service = require('../models/Service');
const Business = require('../models/Business');

exports.getServices = async (req, res) => {
  const { businessId } = req.query;
  const query = { isActive: true };
  if (businessId) query.business = businessId;
  const services = await Service.find(query).populate('business', 'name');
  res.json({ success: true, data: services });
};

exports.createService = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id });
  if (!business) return res.status(404).json({ success: false, message: 'No business profile found.' });
  const service = await Service.create({ ...req.body, business: business._id });
  res.status(201).json({ success: true, data: service });
};

exports.updateService = async (req, res) => {
  const service = await Service.findById(req.params.id).populate('business');
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  if (service.business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: updated });
};

exports.deleteService = async (req, res) => {
  const service = await Service.findById(req.params.id).populate('business');
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  if (service.business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  await service.deleteOne();
  res.json({ success: true, message: 'Service deleted.' });
};
