const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendWelcomeEmail } = require('../services/emailService');

/**
 * Sign a JWT and return the token + sanitized user object.
 * Used after register and login to keep the response shape consistent.
 */
const sendToken = (user, statusCode, res) => {
  const token = user.signToken();
  const userObj = user.toObject();
  delete userObj.password;
  res.status(statusCode).json({ success: true, token, user: userObj });
};

// @desc  Register a new user (customer or business_owner)
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  // Prevent self-promotion to admin – only these two roles are allowed
  const allowedRoles = ['customer', 'business_owner'];
  const assignedRole = allowedRoles.includes(role) ? role : 'customer';

  const user = await User.create({ name, email, password, role: assignedRole });

  // Send welcome email (non-blocking – failure doesn't break registration)
  await sendWelcomeEmail({ to: email, name, role: assignedRole });

  sendToken(user, 201, res);
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
  }

  sendToken(user, 200, res);
};

// @desc  Get currently authenticated user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  Update own profile (name, phone, avatar)
// @route PUT /api/auth/me
// @access Private
exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (phone) updates.phone = phone;

  // If an avatar was uploaded via Multer + Cloudinary, req.file.path holds the CDN URL
  if (req.file) updates.avatar = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
};

// @desc  Change own password
// @route PUT /api/auth/change-password
// @access Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save(); // pre-save hook re-hashes

  sendToken(user, 200, res);
};
