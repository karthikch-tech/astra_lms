const pool = require('../config/db');
const { callProcedure } = require('../config/db');
const { hashPassword } = require('../utils/hash');

const ALLOWED_ROLES = ['ADMIN', 'USER'];

const normalizeRole = (role, fallback = 'USER') => {
  const normalizedRole = String(role || fallback).trim().toUpperCase();
  return ALLOWED_ROLES.includes(normalizedRole) ? normalizedRole : null;
};

const toUserResponse = (userRow) => ({
  id: userRow.id,
  firstName: userRow.first_name,
  lastName: userRow.last_name,
  email: userRow.email,
  username: userRow.username,
  role: userRow.role,
  createdAt: userRow.created_at,
});

const listUsers = async () => {
  const users = await callProcedure('sp_users_get_all');
  return users.map(toUserResponse);
};

const createUserByAdmin = async (payload) => {
  const connection = await pool.getConnection();

  try {
    const role = normalizeRole(payload.role, 'USER');
    if (!role) {
      throw { status: 400, message: 'Invalid role. Must be ADMIN or USER.' };
    }

    const existingUser = await callProcedure(
      'sp_users_find_by_email_or_username',
      [payload.email, payload.username],
      connection
    );

    if (existingUser.length > 0) {
      throw { status: 409, message: 'Email or username already exists' };
    }

    const passwordHash = await hashPassword(payload.password);
    const createdUsers = await callProcedure(
      'sp_users_create',
      [
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.username,
        passwordHash,
        role,
        0,
      ],
      connection
    );

    return toUserResponse(createdUsers[0]);
  } finally {
    connection.release();
  }
};

const getActiveUserById = async (userId, executor = pool) => {
  const users = await callProcedure('sp_users_get_basic_by_id', [userId], executor);
  return users[0] || null;
};

const countActiveAdminsExcludingUser = async (userId, executor = pool) => {
  const rows = await callProcedure('sp_users_count_active_admins_excluding', [userId], executor);
  return Number(rows[0]?.total || 0);
};

const updateUserByAdmin = async (userId, payload) => {
  const connection = await pool.getConnection();

  try {
    const existingUser = await getActiveUserById(userId, connection);
    if (!existingUser) {
      throw { status: 404, message: 'User not found' };
    }

    const role = normalizeRole(payload.role, existingUser.role);
    if (!role) {
      throw { status: 400, message: 'Invalid role. Must be ADMIN or USER.' };
    }

    const duplicateUsers = await callProcedure(
      'sp_users_find_duplicate_except_id',
      [payload.email, payload.username, userId],
      connection
    );

    if (duplicateUsers.length > 0) {
      throw { status: 409, message: 'Email or username already exists' };
    }

    if (existingUser.role === 'ADMIN' && role !== 'ADMIN') {
      const otherAdminCount = await countActiveAdminsExcludingUser(userId, connection);
      if (otherAdminCount === 0) {
        throw { status: 400, message: 'Cannot change role of the last active admin' };
      }
    }

    const nextPassword = String(payload.password || '').trim();
    let updatedUsers = [];

    if (nextPassword) {
      const passwordHash = await hashPassword(nextPassword);
      updatedUsers = await callProcedure(
        'sp_users_update_with_password',
        [userId, payload.firstName, payload.lastName, payload.email, payload.username, role, passwordHash],
        connection
      );
    } else {
      updatedUsers = await callProcedure(
        'sp_users_update_without_password',
        [userId, payload.firstName, payload.lastName, payload.email, payload.username, role],
        connection
      );
    }

    const updatedUser = updatedUsers[0] || (await getActiveUserById(userId, connection));
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

    const existingUser = await getActiveUserById(targetUserId, connection);
    if (!existingUser) {
      throw { status: 404, message: 'User not found' };
    }

    if (existingUser.role === 'ADMIN') {
      const otherAdminCount = await countActiveAdminsExcludingUser(targetUserId, connection);
      if (otherAdminCount === 0) {
        throw { status: 400, message: 'Cannot delete the last active admin' };
      }
    }

    await callProcedure('sp_users_soft_delete', [targetUserId], connection);

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
