const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
} = require('../validators/authValidator');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/password', protect, validate(updatePasswordSchema), updatePassword);

module.exports = router;
