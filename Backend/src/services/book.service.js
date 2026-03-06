const pool = require('../config/db');
const { callProcedure } = require('../config/db');

const mapBookRow = (row) => ({
  id: Number(row.id ?? row.book_id),
  title: row.title,
  author: row.author || row.author_name,
  publisher: row.publisher || null,
  isbn: row.isbn || null,
  language: row.language || null,
  price: row.price !== undefined && row.price !== null ? Number(row.price) : null,
  description: row.description || null,
  category_id: row.category_id !== undefined && row.category_id !== null ? Number(row.category_id) : null,
  category_name: row.category_name || null,
  cover_image_url: row.cover_image_url || row.cover_image || null,
  available_copies: Number(row.available_copies || 0),
  total_copies: Number(row.total_copies || 0),
});

const getCategoryNameById = async (categoryId, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT category_name
      FROM categories
      WHERE category_id = ?
      LIMIT 1
    `,
    [categoryId]
  );

  return rows[0]?.category_name || null;
};

const getBookById = async (bookId, executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT
        b.book_id AS id,
        b.title,
        a.author_name AS author,
        b.publisher,
        b.isbn,
        b.language,
        b.price,
        b.description,
        b.category_id,
        c.category_name,
        b.cover_image AS cover_image_url,
        COUNT(bc.copy_id) AS total_copies,
        COALESCE(SUM(CASE WHEN LOWER(bc.status) = 'available' THEN 1 ELSE 0 END), 0) AS available_copies
      FROM books b
      LEFT JOIN authors a ON a.author_id = b.author_id
      LEFT JOIN categories c ON c.category_id = b.category_id
      LEFT JOIN book_copies bc ON bc.book_id = b.book_id
      WHERE b.book_id = ?
      GROUP BY
        b.book_id,
        b.title,
        a.author_name,
        b.publisher,
        b.isbn,
        b.language,
        b.price,
        b.description,
        b.category_id,
        c.category_name,
        b.cover_image
      LIMIT 1
    `,
    [bookId]
  );

  if (rows.length === 0) {
    throw { status: 404, message: 'Book not found' };
  }

  return mapBookRow(rows[0]);
};

const getAllBooks = async (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.title) {
    conditions.push('b.title LIKE ?');
    params.push(`%${String(filters.title).trim()}%`);
  }

  if (filters.author) {
    conditions.push('a.author_name LIKE ?');
    params.push(`%${String(filters.author).trim()}%`);
  }

  if (filters.categoryId) {
    conditions.push('b.category_id = ?');
    params.push(Number(filters.categoryId));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `
      SELECT
        b.book_id AS id,
        b.title,
        a.author_name AS author,
        b.publisher,
        b.isbn,
        b.language,
        b.price,
        b.description,
        b.category_id,
        c.category_name,
        b.cover_image AS cover_image_url,
        COUNT(bc.copy_id) AS total_copies,
        COALESCE(SUM(CASE WHEN LOWER(bc.status) = 'available' THEN 1 ELSE 0 END), 0) AS available_copies
      FROM books b
      LEFT JOIN authors a ON a.author_id = b.author_id
      LEFT JOIN categories c ON c.category_id = b.category_id
      LEFT JOIN book_copies bc ON bc.book_id = b.book_id
      ${whereClause}
      GROUP BY
        b.book_id,
        b.title,
        a.author_name,
        b.publisher,
        b.isbn,
        b.language,
        b.price,
        b.description,
        b.category_id,
        c.category_name,
        b.cover_image
      ORDER BY b.book_id DESC
    `,
    params
  );

  return rows.map(mapBookRow);
};

const createBook = async (bookData, loggedUserId) => {
  const connection = await pool.getConnection();

  try {
    const categoryName = await getCategoryNameById(bookData.categoryId, connection);
    if (!categoryName) {
      throw { status: 400, message: 'Invalid category selected' };
    }

    const createdRows = await callProcedure(
      'insert_book_details',
      [
        Number(loggedUserId),
        bookData.title,
        bookData.author,
        bookData.publisher,
        bookData.isbn || null,
        bookData.language,
        bookData.price,
        bookData.description || null,
        categoryName,
        bookData.coverImageUrl || null,
      ],
      connection
    );

    const createdResult = createdRows[0] || {};
    const procedureMessage = createdResult.message || '';

    if (!createdResult.book_id || !/inserted successfully/i.test(procedureMessage)) {
      const lowerMessage = String(procedureMessage).toLowerCase();
      if (lowerMessage.includes('already exists')) {
        throw { status: 409, message: procedureMessage };
      }
      if (lowerMessage.includes('access denied')) {
        throw { status: 403, message: procedureMessage };
      }
      if (lowerMessage.includes('unauthorized')) {
        throw { status: 401, message: procedureMessage };
      }
      throw { status: 400, message: procedureMessage || 'Book could not be inserted' };
    }

    return getBookById(createdResult.book_id, connection);
  } finally {
    connection.release();
  }
};

const updateBook = async (bookId, bookData, loggedUserId) => {
  const connection = await pool.getConnection();

  try {
    const categoryName = await getCategoryNameById(bookData.categoryId, connection);
    if (!categoryName) {
      throw { status: 400, message: 'Invalid category selected' };
    }

    const updatedRows = await callProcedure(
      'update_book_details',
      [
        Number(loggedUserId),
        Number(bookId),
        bookData.title,
        bookData.author,
        bookData.publisher,
        bookData.isbn || null,
        bookData.language,
        bookData.price,
        bookData.description || null,
        categoryName,
        bookData.coverImageUrl || null,
      ],
      connection
    );

    const updatedResult = updatedRows[0] || {};
    const statusMessage = updatedResult.status_message || '';
    const message = updatedResult.message || '';

    if (message) {
      const lowerMessage = String(message).toLowerCase();
      if (lowerMessage.includes('book not found')) {
        throw { status: 404, message };
      }
      if (lowerMessage.includes('access denied')) {
        throw { status: 403, message };
      }
      if (lowerMessage.includes('unauthorized')) {
        throw { status: 401, message };
      }
      throw { status: 400, message };
    }

    if (/no changes detected/i.test(statusMessage)) {
      throw { status: 400, message: statusMessage };
    }

    return getBookById(bookId, connection);
  } finally {
    connection.release();
  }
};

const deleteBook = async (bookId, loggedUserId) => {
  const rows = await callProcedure('delete_book', [Number(loggedUserId), Number(bookId)]);
  const result = rows[0] || {};
  const message = result.message || 'Book deleted successfully';
  const lowerMessage = String(message).toLowerCase();

  if (!lowerMessage.includes('success')) {
    if (lowerMessage.includes('book not found')) {
      throw { status: 404, message };
    }
    if (lowerMessage.includes('access denied')) {
      throw { status: 403, message };
    }
    if (lowerMessage.includes('invalid or inactive')) {
      throw { status: 401, message };
    }
    throw { status: 400, message };
  }

  return { message };
};

const searchBooks = async (queryText) => {
  const rows = await callProcedure('multi_search', [queryText || '']);

  return rows.map((row) => ({
    id: Number(row.book_id),
    title: row.title,
    author: row.author_name,
    category_name: row.category_name || null,
    available_copies: Number(row.available_copies || 0),
    total_copies: Number(row.total_copies || 0),
  }));
};

const getBookAvailability = async () => {
  const [rows] = await pool.query(
    `
      SELECT
        book_id AS id,
        title,
        total_copies,
        available_copies,
        unavailable_copies
      FROM vw_book_availability
      ORDER BY title ASC
    `
  );

  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    total_copies: Number(row.total_copies || 0),
    available_copies: Number(row.available_copies || 0),
    unavailable_copies: Number(row.unavailable_copies || 0),
  }));
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  searchBooks,
  getBookAvailability,
};
