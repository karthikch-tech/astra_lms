const pool = require('../config/db');
const { callProcedure } = require('../config/db');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await callProcedure('sp_categories_get_all');

    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  let connection;

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    connection = await pool.getConnection();

    const existing = await callProcedure('sp_categories_find_by_name', [name], connection);

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const createdCategories = await callProcedure('sp_categories_create', [name], connection);
    const createdCategory = createdCategories[0];

    res.status(201).json({ id: createdCategory.id, name: createdCategory.name });
  } catch (error) {
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getAllCategories,
  createCategory,
};
