const User = require('../models/User');
const { sendTokenResponse, clearTokenResponse } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, 'An account with this email address already exists.');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    return sendTokenResponse(user, 201, res, 'Registration successful! Welcome to StudyFlow AI.');
  } catch (err) {
    next(err);
  }
};

// @desc    Log in user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    return sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

// @desc    Log out user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    clearTokenResponse(res);
    return successResponse(res, 200, 'Successfully logged out.');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return successResponse(res, 200, 'User profile retrieved', user);
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, timezone, profileImage } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (timezone) fieldsToUpdate.timezone = timezone;
    if (profileImage !== undefined) fieldsToUpdate.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, 200, 'Profile updated successfully', user);
  } catch (err) {
    next(err);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
};
