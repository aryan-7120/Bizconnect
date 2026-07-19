const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { registerValidators, loginValidators, changePasswordValidators } = require('../utils/validators');

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, upload.single('avatar'), updateProfile);
router.put('/change-password', authenticate, changePasswordValidators, changePassword);

module.exports = router;
