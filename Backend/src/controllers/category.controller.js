const pool = require('../config/db');

const getAllCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT
          category_id AS id,
          category_name AS name
        FROM categories
        ORDER BY category_name ASC
      `
    );

    res.status(200).json(rows);
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

    const [existingRows] = await connection.query(
      `
        SELECT category_id
        FROM categories
        WHERE LOWER(category_name) = LOWER(?)
        LIMIT 1
      `,
      [String(name).trim()]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const [result] = await connection.query(
      `
        INSERT INTO categories (category_name)
        VALUES (?)
      `,
      [String(name).trim()]
    );

    const [createdRows] = await connection.query(
      `
        SELECT
          category_id AS id,
          category_name AS name
        FROM categories
        WHERE category_id = ?
        LIMIT 1
      `,
      [result.insertId]
    );
    const createdCategory = createdRows[0];

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
