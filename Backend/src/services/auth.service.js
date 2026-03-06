const pool = require('../config/db');
const { callProcedure } = require('../config/db');
const { callProcedureWithOutParams } = require('../config/db');
const { generateToken } = require('../utils/jwt');

const splitFullName = (fullName) => {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const nameParts = trimmed.split(/\s+/);
  const firstName = nameParts.shift() || '';
  const lastName = nameParts.join(' ');
  return { firstName, lastName };
};

const toRole = (roleName) => {
  const normalized = String(roleName || '').trim().toUpperCase();
  return normalized === 'ADMIN' ? 'ADMIN' : 'USER';
};

const toUserResponse = (userRow) => {
  const { firstName, lastName } = splitFullName(userRow.full_name);

  return {
    id: userRow.user_id,
    firstName,
    lastName,
    email: userRow.email,
    username: userRow.username,
    role: toRole(userRow.role_name),
  };
};

const getUserRowById = async (userId, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.email,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ?
        AND u.is_active = TRUE
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
};

const getUserRowByEmail = async (email, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.email,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE LOWER(u.email) = LOWER(?)
        AND u.is_active = TRUE
      LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
};

const validateEmailUsingProcedure = async (email, executor) => {
  const emailValidation = await callProcedureWithOutParams(
    'validate_email',
    [email],
    ['message', 'code'],
    executor
  );

  if (Number(emailValidation.code) !== 1) {
    throw { status: 400, message: emailValidation.message || 'Invalid email format' };
  }
};

const validatePasswordUsingProcedure = async (password, executor) => {
  const passwordValidation = await callProcedureWithOutParams(
    'validate_password_strength',
    [password],
    ['code', 'message'],
    executor
  );

  if (Number(passwordValidation.code) !== 1) {
    throw { status: 400, message: passwordValidation.message || 'Weak password' };
  }
};

const encryptPasswordUsingProcedure = async (password, executor) => {
  return callProcedureWithOutParams(
    'encrypt_password',
    [password],
    ['hash'],
    executor
  );
};

const registerUser = async (firstName, lastName, email, username, password, requestedRole = 'USER') => {
  const connection = await pool.getConnection();

  try {
    const role = String(requestedRole || 'USER').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedUsername = String(username || '').trim().toLowerCase();

    await validateEmailUsingProcedure(normalizedEmail, connection);
    await validatePasswordUsingProcedure(password, connection);
    await encryptPasswordUsingProcedure(password, connection);

    const procedureName = role === 'ADMIN' ? 'insert_admin' : 'insert_user';
    const procedureParams = role === 'ADMIN'
      ? [firstName, lastName, normalizedUsername, normalizedEmail, password]
      : [firstName, lastName, normalizedUsername, normalizedEmail, password, password];

    const registrationRows = await callProcedure(procedureName, procedureParams, connection);
    const registrationResult = registrationRows[0] || {};

    if (registrationResult.message && !registrationResult.status_message) {
      throw { status: 400, message: registrationResult.message };
    }

    const createdUser = await getUserRowByEmail(normalizedEmail, connection);
    if (!createdUser) {
      throw { status: 500, message: 'User registration succeeded but user could not be loaded' };
    }

    return {
      ...toUserResponse(createdUser),
      role,
    };
  } finally {
    connection.release();
  }
};

const loginUser = async (emailOrUsername, password) => {
  const connection = await pool.getConnection();

  try {
    const normalizedIdentifier = String(emailOrUsername || '').trim().toLowerCase();
    await encryptPasswordUsingProcedure(password, connection);

    let loginRows = await callProcedure(
      'login_user',
      [normalizedIdentifier, password],
      connection
    );

    let loginResult = loginRows[0] || {};

    if (!loginResult.user_id) {
      const adminLoginRows = await callProcedure(
        'login_admin',
        [normalizedIdentifier, password],
        connection
      );
      const adminLoginResult = adminLoginRows[0] || {};

      if (adminLoginResult.user_id) {
        loginRows = adminLoginRows;
        loginResult = adminLoginResult;
      }
    }

    if (!loginResult.user_id) {
      throw {
        status: 401,
        message: loginResult.message || 'Invalid username/email or password',
      };
    }

    const userRow = await getUserRowById(loginResult.user_id, connection);
    if (!userRow) {
      throw { status: 404, message: 'User not found or inactive' };
    }

    const role = toRole(userRow.role_name);
    const token = generateToken(userRow.user_id, role);

    return {
      token,
      user: {
        ...toUserResponse(userRow),
        role,
      },
    };
  } finally {
    connection.release();
  }
};

const getUserById = async (userId) => {
  const userRow = await getUserRowById(userId);

  if (!userRow) {
    throw { status: 404, message: 'User not found' };
  }

  return toUserResponse(userRow);
};

const updateMyProfile = async (userId, payload) => {
  const connection = await pool.getConnection();

  try {
    const currentUser = await getUserRowById(userId, connection);
    if (!currentUser) {
      throw { status: 404, message: 'User not found' };
    }

    const currentPassword = String(payload.currentPassword || '').trim();
    if (!currentPassword) {
      throw { status: 400, message: 'Current password is required' };
    }

    const procedureName = toRole(currentUser.role_name) === 'ADMIN'
      ? 'update_admin_profile'
      : 'update_profile';

    const rows = await callProcedure(
      procedureName,
      [
        currentUser.email,
        currentPassword,
        payload.firstName || null,
        payload.lastName || null,
        payload.username || null,
        payload.email || null,
        payload.password || null,
      ],
      connection
    );

    const procedureResult = rows[0] || {};

    if (procedureResult.message && !procedureResult.status_message) {
      throw { status: 400, message: procedureResult.message };
    }

    const updatedUser = await getUserRowById(userId, connection);
    if (!updatedUser) {
      throw { status: 404, message: 'User not found after profile update' };
    }

    return {
      message: procedureResult.status_message || 'Profile updated successfully.',
      user: toUserResponse(updatedUser),
    };
  } finally {
    connection.release();
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateMyProfile,
};
