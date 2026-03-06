const pool = require('../config/db');
const { callProcedure } = require('../config/db');
const { callProcedureWithOutParams } = require('../config/db');

const ALLOWED_ROLES = ['ADMIN', 'USER'];

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

const roleFromDb = (roleName) => (
  String(roleName || '').trim().toLowerCase() === 'admin'
    ? 'ADMIN'
    : 'USER'
);

const roleToDb = (roleName) => (
  String(roleName || '').trim().toUpperCase() === 'ADMIN'
    ? 'admin'
    : 'user'
);

const normalizeRole = (role, fallback = 'USER') => {
  const normalizedRole = String(role || fallback).trim().toUpperCase();
  return ALLOWED_ROLES.includes(normalizedRole) ? normalizedRole : null;
};

const toUserResponse = (userRow) => {
  const { firstName, lastName } = splitFullName(userRow.full_name);

  return {
    id: userRow.user_id,
    firstName,
    lastName,
    email: userRow.email,
    username: userRow.username,
    role: roleFromDb(userRow.role_name),
    createdAt: userRow.created_at,
  };
};

const buildFullName = (firstName, lastName) => {
  const normalizedFirstName = String(firstName || '').trim();
  const normalizedLastName = String(lastName || '').trim();
  return normalizedLastName ? `${normalizedFirstName} ${normalizedLastName}` : normalizedFirstName;
};

const getUserById = async (userId, executor = pool, activeOnly = true) => {
  const [rows] = await executor.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.email,
        u.password_hash,
        u.created_at,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ?
        ${activeOnly ? 'AND u.is_active = TRUE' : ''}
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
};

const getUserByEmail = async (email, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.email,
        u.created_at,
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

const getRoleId = async (roleName, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT role_id
      FROM roles
      WHERE role_name = ?
      LIMIT 1
    `,
    [roleName]
  );

  return rows[0]?.role_id || null;
};

const ensureNoDuplicateUser = async (email, username, excludedUserId, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT user_id
      FROM users
      WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?))
        AND user_id <> ?
        AND is_active = TRUE
      LIMIT 1
    `,
    [email, username, excludedUserId]
  );

  if (rows.length > 0) {
    throw { status: 409, message: 'Email or username already exists' };
  }
};

const countActiveAdminsExcluding = async (excludedUserId, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT COUNT(*) AS total
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.is_active = TRUE
        AND r.role_name = 'admin'
        AND u.user_id <> ?
    `,
    [excludedUserId]
  );

  return Number(rows[0]?.total || 0);
};

const validateEmail = async (email, executor) => {
  const validation = await callProcedureWithOutParams(
    'validate_email',
    [email],
    ['message', 'code'],
    executor
  );

  if (Number(validation.code) !== 1) {
    throw { status: 400, message: validation.message || 'Invalid email format' };
  }
};

const validatePassword = async (password, executor) => {
  const validation = await callProcedureWithOutParams(
    'validate_password_strength',
    [password],
    ['code', 'message'],
    executor
  );

  if (Number(validation.code) !== 1) {
    throw { status: 400, message: validation.message || 'Weak password' };
  }
};

const encryptPassword = async (password, executor) => {
  return callProcedureWithOutParams(
    'encrypt_password',
    [password],
    ['hash'],
    executor
  );
};

const listUsers = async () => {
  const [rows] = await pool.query(
    `
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.email,
        u.created_at,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.is_active = TRUE
      ORDER BY u.user_id DESC
    `
  );

  return rows.map(toUserResponse);
};

const createUserByAdmin = async (payload) => {
  const connection = await pool.getConnection();

  try {
    const role = normalizeRole(payload.role, 'USER');
    if (!role) {
      throw { status: 400, message: 'Invalid role. Must be ADMIN or USER.' };
    }

    const firstName = String(payload.firstName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const username = String(payload.username || '').trim().toLowerCase();
    const password = String(payload.password || '');

    await validateEmail(email, connection);
    await validatePassword(password, connection);
    await encryptPassword(password, connection);

    const procedureName = role === 'ADMIN' ? 'insert_admin' : 'insert_user';
    const procedureParams = role === 'ADMIN'
      ? [firstName, lastName, username, email, password]
      : [firstName, lastName, username, email, password, password];

    const rows = await callProcedure(procedureName, procedureParams, connection);
    const result = rows[0] || {};

    if (result.message && !result.status_message) {
      const normalizedMessage = String(result.message).toLowerCase();
      if (normalizedMessage.includes('already exists')) {
        throw { status: 409, message: result.message };
      }
      throw { status: 400, message: result.message };
    }

    const createdUser = await getUserByEmail(email, connection);
    if (!createdUser) {
      throw { status: 500, message: 'User created but could not be loaded' };
    }

    return toUserResponse(createdUser);
  } finally {
    connection.release();
  }
};

const updateUserByAdmin = async (userId, payload) => {
  const connection = await pool.getConnection();

  try {
    const existingUser = await getUserById(userId, connection, true);
    if (!existingUser) {
      throw { status: 404, message: 'User not found' };
    }

    const role = normalizeRole(payload.role, roleFromDb(existingUser.role_name));
    if (!role) {
      throw { status: 400, message: 'Invalid role. Must be ADMIN or USER.' };
    }

    const firstName = String(payload.firstName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const username = String(payload.username || '').trim().toLowerCase();
    const password = String(payload.password || '').trim();

    await validateEmail(email, connection);
    await ensureNoDuplicateUser(email, username, userId, connection);

    if (roleFromDb(existingUser.role_name) === 'ADMIN' && role !== 'ADMIN') {
      const otherAdminCount = await countActiveAdminsExcluding(userId, connection);
      if (otherAdminCount === 0) {
        throw { status: 400, message: 'Cannot change role of the last active admin' };
      }
    }

    const roleId = await getRoleId(roleToDb(role), connection);
    if (!roleId) {
      throw { status: 500, message: 'Role not configured in database' };
    }

    const params = [
      buildFullName(firstName, lastName),
      username,
      email,
      roleId,
      userId,
    ];

    let updateSql = `
      UPDATE users
      SET
        full_name = ?,
        username = ?,
        email = ?,
        role_id = ?,
        updated_at = NOW()
      WHERE user_id = ?
        AND is_active = TRUE
    `;

    if (password) {
      await validatePassword(password, connection);
      const encrypted = await encryptPassword(password, connection);
      updateSql = `
        UPDATE users
        SET
          full_name = ?,
          username = ?,
          email = ?,
          role_id = ?,
          password_hash = ?,
          updated_at = NOW()
        WHERE user_id = ?
          AND is_active = TRUE
      `;
      params.splice(4, 0, encrypted.hash);
    }

    await connection.query(updateSql, params);

    const updatedUser = await getUserById(userId, connection, true);
    if (!updatedUser) {
      throw { status: 404, message: 'User not found after update' };
    }

    return toUserResponse(updatedUser);
  } finally {
    connection.release();
  }
};

const deleteUserByAdmin = async (targetUserId, actingUserId) => {
  const connection = await pool.getConnection();

  try {
    if (Number(targetUserId) === Number(actingUserId)) {
      throw { status: 400, message: 'You cannot delete your own account' };
    }

    const existingUser = await getUserById(targetUserId, connection, true);
    if (!existingUser) {
      throw { status: 404, message: 'User not found' };
    }

    if (roleFromDb(existingUser.role_name) === 'ADMIN') {
      const otherAdminCount = await countActiveAdminsExcluding(targetUserId, connection);
      if (otherAdminCount === 0) {
        throw { status: 400, message: 'Cannot delete the last active admin' };
      }
    }

    await connection.query(
      `
        UPDATE users
        SET is_active = FALSE, updated_at = NOW()
        WHERE user_id = ?
          AND is_active = TRUE
      `,
      [targetUserId]
    );

    return { message: 'User deleted successfully' };
  } finally {
    connection.release();
  }
};

module.exports = {
  listUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
};
