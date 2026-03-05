const {
  listUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
} = require('../services/user.service');

const hasRequiredUserFields = (payload) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'username', 'role'];

  for (const field of requiredFields) {
    if (!payload[field] || String(payload[field]).trim() === '') {
      return false;
    }
  }

  return true;
};

const getUsers = async (req, res, next) => {
  try {
    const users = await listUsers();
    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, username, password, role } = req.body;

    if (!hasRequiredUserFields({ firstName, lastName, email, username, role })) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!password || String(password).trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await createUserByAdmin({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim(),
      username: String(username).trim(),
      password: String(password),
      role: String(role).trim(),
    });

    return res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, password, role } = req.body;

    if (!hasRequiredUserFields({ firstName, lastName, email, username, role })) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await updateUserByAdmin(Number(id), {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim(),
      username: String(username).trim(),
      password: password ? String(password) : '',
      role: String(role).trim(),
    });

    return res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actingUserId = req.user?.id;

    if (!actingUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await deleteUserByAdmin(Number(id), Number(actingUserId));
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
