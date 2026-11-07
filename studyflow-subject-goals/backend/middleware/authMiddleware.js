const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Or check HTTP-only cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token || token === 'none') {
      return errorResponse(res, 401, 'Not authorized to access this resource. Please log in.');
    }

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return errorResponse(res, 401, 'User associated with this token no longer exists.');
      }

      req.user = user;
      next();
    } catch (tokenErr) {
      if (tokenErr.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Your session has expired. Please log in again.');
      }
      return errorResponse(res, 401, 'Invalid authentication token.');
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  protect,
};
