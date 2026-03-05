const { registerUser, loginUser, getUserById } = require('../services/auth.service');

const getRegistrationPayload = (req) => {
  const {
    firstName,
    lastName,
    email,
    username,
    password,
    confirmPassword,
  } = req.body;

  if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
    return { error: 'All fields are required' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  return {
    firstName,
    lastName,
    email,
    username,
    password,
  };
};

const register = async (req, res, next) => {
  try {
    const payload = getRegistrationPayload(req);
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const user = await registerUser(
      payload.firstName,
      payload.lastName,
      payload.email,
      payload.username,
      payload.password,
      'USER'
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    return next(error);
  }
};

const registerAdmin = async (req, res, next) => {
  try {
    const configuredSetupKey = String(process.env.ADMIN_SETUP_KEY || '').trim();
    const incomingSetupKey = String(req.headers['x-admin-setup-key'] || '').trim();
    const isDevMode = String(process.env.NODE_ENV || 'development').toLowerCase() !== 'production';

    if (configuredSetupKey && incomingSetupKey !== configuredSetupKey) {
      return res.status(403).json({ message: 'Invalid admin setup key' });
    }

    if (!configuredSetupKey && !isDevMode) {
      return res.status(500).json({ message: 'Admin setup key is not configured on server' });
    }

    const payload = getRegistrationPayload(req);
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const user = await registerUser(
      payload.firstName,
      payload.lastName,
      payload.email,
      payload.username,
      payload.password,
      'ADMIN'
    );

    return res.status(201).json({
      message: 'Admin registered successfully',
      user,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    const result = await loginUser(emailOrUsername, password);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // Support both shapes: { userId } or { id }
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await getUserById(userId);
    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  registerAdmin,
  login,
  getMe,
};
