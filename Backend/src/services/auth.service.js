const pool = require('../config/db');
const { callProcedure } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

const registerUser = async (firstName, lastName, email, username, password, requestedRole = 'USER') => {
  const connection = await pool.getConnection();

  try {
    const existingUser = await callProcedure(
      'sp_users_find_by_email_or_username',
      [email, username],
      connection
    );

    if (existingUser.length > 0) {
      throw { status: 409, message: 'Email or username already exists' };
    }

    const role = String(requestedRole || 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';

    const hashedPassword = await hashPassword(password);
    const createdUsers = await callProcedure(
      'sp_users_create',
      [firstName, lastName, email, username, hashedPassword, role, 0],
      connection
    );
    const createdUser = createdUsers[0];

    return {
      id: createdUser.id,
      firstName: createdUser.first_name,
      lastName: createdUser.last_name,
      email: createdUser.email,
      username: createdUser.username,
      role: createdUser.role,
    };
  } finally {
    connection.release();
  }
};

const loginUser = async (emailOrUsername, password) => {
  const users = await callProcedure('sp_users_login_lookup', [emailOrUsername]);

  if (users.length === 0) {
    throw { status: 401, message: 'Invalid email/username or password' };
  }

  const user = users[0];
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw { status: 401, message: 'Invalid email/username or password' };
  }

  const token = generateToken(user.id, user.role);

  return {
    token,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  };
};

const getUserById = async (userId) => {
  const users = await callProcedure('sp_users_get_by_id', [userId]);

  if (users.length === 0) {
    throw { status: 404, message: 'User not found' };
  }

  const user = users[0];
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    username: user.username,
    role: user.role,
  };
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
