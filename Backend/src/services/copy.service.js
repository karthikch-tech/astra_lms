const pool = require('../config/db');
const { callProcedure } = require('../config/db');

const CLIENT_AVAILABLE_STATUS = 'AVAILABLE';
const CLIENT_UNAVAILABLE_STATUS = 'UNAVAILABLE';

const normalizeStatus = (status) => String(status || '').trim().toUpperCase();
const normalizeCopyCode = (copyCode) => String(copyCode || '').trim();

const toClientStatus = (dbStatus) => (
  normalizeStatus(dbStatus) === CLIENT_AVAILABLE_STATUS
    ? CLIENT_AVAILABLE_STATUS
    : CLIENT_UNAVAILABLE_STATUS
);

const toDatabaseStatus = (clientStatus) => (
  normalizeStatus(clientStatus) === CLIENT_AVAILABLE_STATUS
    ? CLIENT_AVAILABLE_STATUS
    : 'GIVEN'
);

const mapCopyToClient = (copy) => ({
  ...copy,
  status: toClientStatus(copy.status),
});

const addBookCopies = async (bookId, copyIds) => {
  const connection = await pool.getConnection();
  
  try {
    const books = await callProcedure('sp_books_exists_active', [bookId], connection);

    if (books.length === 0) {
      throw { status: 404, message: 'Book not found' };
    }

    const results = [];

    for (const copyCode of copyIds) {
      const existingCopy = await callProcedure('sp_copies_find_by_code', [copyCode], connection);

      if (existingCopy.length > 0) {
        results.push({ copyCode, status: 'FAILED', message: 'Copy code already exists' });
        continue;
      }

      const createdCopies = await callProcedure(
        'sp_copies_create',
        [bookId, copyCode, 'AVAILABLE', 0],
        connection
      );
      const createdCopy = createdCopies[0];

      results.push({
        id: createdCopy.id,
        bookId: createdCopy.book_id,
        copyCode: createdCopy.copy_code,
        status: toClientStatus(createdCopy.status),
        message: 'Copy added successfully',
      });
    }

    return results;
  } finally {
    connection.release();
  }
};

const getBookCopies = async (bookId) => {
  const copies = await callProcedure('sp_copies_get_by_book', [bookId]);
  return copies.map(mapCopyToClient);
};

const updateCopyStatus = async (copyId, newStatus) => {
  const connection = await pool.getConnection();
  
  try {
    const validStatuses = [CLIENT_AVAILABLE_STATUS, CLIENT_UNAVAILABLE_STATUS];
    const requestedStatus = normalizeStatus(newStatus);

    if (!validStatuses.includes(requestedStatus)) {
      throw { status: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
    }

    const copies = await callProcedure('sp_copies_get_by_id', [copyId], connection);

    if (copies.length === 0) {
      throw { status: 404, message: 'Book copy not found' };
    }

    const copy = copies[0];
    const currentStatus = toClientStatus(copy.status);

    if (currentStatus === requestedStatus) {
      throw { status: 400, message: 'Copy already has this status' };
    }

    const updatedCopies = await callProcedure(
      'sp_copies_update_status',
      [copyId, toDatabaseStatus(requestedStatus)],
      connection
    );
    const updatedCopy = updatedCopies[0];

    return {
      id: updatedCopy.id,
      bookId: updatedCopy.book_id,
      copyCode: updatedCopy.copy_code,
      status: toClientStatus(updatedCopy.status),
    };
  } finally {
    connection.release();
  }
};

const updateCopyCode = async (copyId, newCopyCode) => {
  const connection = await pool.getConnection();

  try {
    const normalizedCopyCode = normalizeCopyCode(newCopyCode);
    if (!normalizedCopyCode) {
      throw { status: 400, message: 'Copy code is required' };
    }

    const copies = await callProcedure('sp_copies_get_by_id', [copyId], connection);

    if (copies.length === 0) {
      throw { status: 404, message: 'Book copy not found' };
    }

    const currentCopy = copies[0];
    if (currentCopy.copy_code === normalizedCopyCode) {
      throw { status: 400, message: 'Copy code is the same; cannot be updated' };
    }

    const duplicateCopies = await callProcedure('sp_copies_find_by_code', [normalizedCopyCode], connection);
    if (duplicateCopies.length > 0 && Number(duplicateCopies[0].id) !== Number(copyId)) {
      throw { status: 409, message: 'Copy code already exists' };
    }

    const updatedCopies = await callProcedure(
      'sp_copies_update_code',
      [copyId, normalizedCopyCode],
      connection
    );
    const updatedCopy = updatedCopies[0];

    return {
      id: updatedCopy.id,
      bookId: updatedCopy.book_id,
      copyCode: updatedCopy.copy_code,
      status: toClientStatus(updatedCopy.status),
    };
  } finally {
    connection.release();
  }
};

const deleteCopy = async (copyId) => {
  const connection = await pool.getConnection();
  
  try {
    const copies = await callProcedure('sp_copies_get_by_id', [copyId], connection);

    if (copies.length === 0) {
      throw { status: 404, message: 'Book copy not found' };
    }

    await callProcedure('sp_copies_soft_delete', [copyId], connection);

    return { message: 'Copy deleted successfully' };
  } finally {
    connection.release();
  }
};

const searchByCallNumber = async (copyCode) => {
  const copies = await callProcedure('sp_copies_search_with_book', [copyCode]);

  if (copies.length === 0) {
    throw { status: 404, message: 'Copy not found' };
  }

  return mapCopyToClient(copies[0]);
};

module.exports = {
  addBookCopies,
  getBookCopies,
  updateCopyStatus,
  updateCopyCode,
  deleteCopy,
  searchByCallNumber,
};
