const pool = require('../config/db');
const { callProcedure } = require('../config/db');

const checkBookExists = async (title, author, publisher, isbn, language, categoryId, executor = pool) => {
  const books = await callProcedure(
    'sp_books_find_duplicate',
    [title, author, publisher, isbn || null, language, categoryId],
    executor
  );

  return books.length > 0 ? books[0].id : null;
};

const createBook = async (bookData) => {
  const connection = await pool.getConnection();
  
  try {
    const existingBookId = await checkBookExists(
      bookData.title,
      bookData.author,
      bookData.publisher,
      bookData.isbn,
      bookData.language,
      bookData.categoryId,
      connection
    );

    if (existingBookId) {
      throw { status: 409, message: 'Same book details already exist. Add copies instead of creating new book.' };
    }

    const createdBooks = await callProcedure(
      'sp_books_create',
      [
        bookData.title,
        bookData.author,
        bookData.publisher,
        bookData.isbn || null,
        bookData.language,
        bookData.price,
        bookData.description,
        bookData.categoryId,
        bookData.coverImageUrl || null,
        0,
      ],
      connection
    );

    return createdBooks[0];
  } finally {
    connection.release();
  }
};

const getAllBooks = async (filters = {}) => {
  return callProcedure('sp_books_get_all', [
    filters.title || null,
    filters.author || null,
    filters.categoryId || null,
  ]);
};

const getBookById = async (bookId) => {
  const books = await callProcedure('sp_books_get_by_id', [bookId]);

  if (books.length === 0) {
    throw { status: 404, message: 'Book not found' };
  }

  return books[0];
};

const updateBook = async (bookId, bookData) => {
  const connection = await pool.getConnection();
  
  try {
    const existingBooks = await callProcedure('sp_books_get_basic_by_id', [bookId], connection);

    if (existingBooks.length === 0) {
      throw { status: 404, message: 'Book not found' };
    }

    const existing = existingBooks[0];

    if (
      existing.title === bookData.title &&
      existing.author === bookData.author &&
      existing.publisher === bookData.publisher &&
      existing.isbn === (bookData.isbn || null) &&
      existing.language === bookData.language &&
      existing.category_id === bookData.categoryId &&
      existing.price === bookData.price &&
      existing.description === bookData.description &&
      existing.cover_image_url === (bookData.coverImageUrl || null)
    ) {
      throw { status: 400, message: 'Details are the same; cannot be updated' };
    }

    const duplicateId = await checkBookExists(
      bookData.title,
      bookData.author,
      bookData.publisher,
      bookData.isbn,
      bookData.language,
      bookData.categoryId,
      connection
    );

    if (duplicateId && duplicateId !== Number(bookId)) {
      throw { status: 409, message: 'Same book details already exist. Cannot update to duplicate details.' };
    }

    const updatedBooks = await callProcedure(
      'sp_books_update',
      [
        Number(bookId),
        bookData.title,
        bookData.author,
        bookData.publisher,
        bookData.isbn || null,
        bookData.language,
        bookData.price,
        bookData.description,
        bookData.categoryId,
        bookData.coverImageUrl || null,
      ],
      connection
    );

    return updatedBooks[0];
  } finally {
    connection.release();
  }
};

const deleteBook = async (bookId, hardDelete = false) => {
  const connection = await pool.getConnection();
  
  try {
    const books = await callProcedure('sp_books_exists_active', [bookId], connection);

    if (books.length === 0) {
      throw { status: 404, message: 'Book not found' };
    }

    if (hardDelete) {
      await callProcedure('sp_books_hard_delete', [bookId], connection);
    } else {
      await callProcedure('sp_books_soft_delete', [bookId], connection);
    }

    return { message: 'Book deleted successfully' };
  } finally {
    connection.release();
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  checkBookExists,
};
