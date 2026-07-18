const User = require('../models/User');
const { sendEmail } = require('../config/nodemailer');
const { validationResult } = require('express-validator');

const sendToken = (user, statusCode, res) => {
  const token = user.signToken();
  const userObj = user.toObject();
  delete userObj.password;
  res.status(statusCode).json({ success: true, token, user: userObj });
};

// @desc  Register user
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { name, email, password, role } = req.body;
  // Prevent self-promotion to admin
  const allowedRoles = ['customer', 'business_owner'];
  const assignedRole = allowedRoles.includes(role) ? role : 'customer';

  const user = await User.create({ name, email, password, role: assignedRole });

  // Welcome email
  await sendEmail({
    to: email,
    subject: 'Welcome to BizConnect! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to BizConnect, ${name}!</h2>
        <p>Your account has been created successfully as a <strong>${assignedRole.replace('_', ' ')}</strong>.</p>
        <p>Start exploring businesses and booking appointments today.</p>
        <a href="${process.env.CLIENT_URL}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Get Started</a>
      </div>
    `,
  });

  sendToken(user, 201, res);
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
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

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  Update profile
// @route PUT /api/auth/me
// @access Private
exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (req.file) updates.avatar = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
};

// @desc  Change password
// @route PUT /api/auth/change-password
// @access Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
};
