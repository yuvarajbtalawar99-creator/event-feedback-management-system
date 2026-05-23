const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eventpulse_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

// Generate Token helper
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.statusCode = 400;
      throw new Error('Please fill in name, email, and password');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.statusCode = 409;
      throw new Error('User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user', // strictly limit to 'admin' or 'user'
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.statusCode = 400;
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      throw new Error('Please enter email and password');
    }

    // Check user email
    const user = await User.findOne({ email });
    if (!user) {
      res.statusCode = 401;
      throw new Error('Invalid credentials');
    }

    // Check if the user is a Google-only user
    if (user.isGoogleUser && !user.password) {
      res.statusCode = 400;
      throw new Error('This account was created via Google. Please use Continue with Google.');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Invalid credentials');
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Real Google Sign-In
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleSignIn = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.statusCode = 400;
      throw new Error('Missing Google ID token');
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    const { sub: googleId, name, email } = payload;

    // Find if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, link Google ID if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.isGoogleUser = true;
        await user.save();
      }
    } else {
      // Automatically assign 'admin' role to known admin email patterns
      const isAdminEmail = [
        'yuvarajbtalawar',
        'vyonlabs',
      ].some(pattern => email.toLowerCase().includes(pattern));

      // Create new user from Google Auth
      user = await User.create({
        name,
        email,
        googleId,
        isGoogleUser: true,
        role: isAdminEmail ? 'admin' : 'user',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};
