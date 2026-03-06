const pool = require('../config/db');
const { callProcedure } = require('../config/db');

const CLIENT_AVAILABLE_STATUS = 'AVAILABLE';
const CLIENT_UNAVAILABLE_STATUS = 'UNAVAILABLE';
const MYSQL_INT_MAX = 2147483647;
const COPY_ID_PATTERN = /^\d+$/;

const normalizeStatus = (status) => String(status || '').trim().toUpperCase();
const normalizeCopyCode = (copyCode) => String(copyCode || '').trim();
const isValidMysqlInt = (value) => Number.isInteger(value) && value > 0 && value <= MYSQL_INT_MAX;

const parseCopyId = (rawCopyId) => {
  const normalizedCopyId = normalizeCopyCode(rawCopyId);
  if (!normalizedCopyId || !COPY_ID_PATTERN.test(normalizedCopyId)) {
    return null;
  }

  const parsedCopyId = Number(normalizedCopyId);
  return isValidMysqlInt(parsedCopyId) ? parsedCopyId : null;
};

const toClientStatus = (dbStatus) => (
  String(dbStatus || '').trim().toLowerCase() === 'available'
    ? CLIENT_AVAILABLE_STATUS
    : CLIENT_UNAVAILABLE_STATUS
);

const toDatabaseStatus = (clientStatus) => (
  normalizeStatus(clientStatus) === CLIENT_AVAILABLE_STATUS
    ? 'available'
    : 'unavailable'
);

const mapCopyToClient = (copy) => ({
  id: Number(copy.copy_id),
  book_id: Number(copy.book_id),
  copy_code: String(copy.copy_id),
  status: toClientStatus(copy.status),
});

const mapProcedureMessageToError = (message) => {
  const normalizedMessage = String(message || '').toLowerCase();
  if (normalizedMessage.includes('access denied')) {
    return 403;
  }
  if (normalizedMessage.includes('unauthorized')) {
    return 401;
  }
  if (normalizedMessage.includes('not found')) {
    return 404;
  }
  return 400;
};

const getNextCopyId = async (executor = pool) => {
  const [rows] = await executor.query(
    `
      SELECT COALESCE(MAX(copy_id), 0) + 1 AS next_copy_id
      FROM book_copies
    `
  );

  const nextCopyId = Number(rows[0]?.next_copy_id || 1);
  return isValidMysqlInt(nextCopyId) ? nextCopyId : null;
};

const getCopyById = async (copyId, executor = pool) => {
  const normalizedCopyId = Number(copyId);
  if (!isValidMysqlInt(normalizedCopyId)) {
    return null;
  }

  const [rows] = await executor.query(
    `
      SELECT copy_id, book_id, status
      FROM book_copies
      WHERE copy_id = ?
      LIMIT 1
    `,
    [normalizedCopyId]
  );

  return rows[0] || null;
};

const addBookCopies = async (bookId, copyIds, loggedUserId) => {
  const connection = await pool.getConnection();

  try {
    const results = [];
    let nextAutoCopyId = await getNextCopyId(connection);

    if (!nextAutoCopyId) {
      throw { status: 500, message: 'Unable to allocate copy IDs. Reached maximum INT range.' };
    }

    for (const rawCopyCode of copyIds) {
      const parsedCopyId = parseCopyId(rawCopyCode);
      let copyIdToInsert = parsedCopyId;

      if (!copyIdToInsert) {
        copyIdToInsert = nextAutoCopyId;
        nextAutoCopyId += 1;

        if (!isValidMysqlInt(copyIdToInsert)) {
          results.push({
            copyCode: '',
            status: 'FAILED',
            message: 'Unable to allocate copy ID. Reached maximum INT range.',
          });
          continue;
        }
      } else if (copyIdToInsert >= nextAutoCopyId) {
        nextAutoCopyId = copyIdToInsert + 1;
      }

      const rows = await callProcedure(
        'add_book_copy',
        [Number(loggedUserId), Number(bookId), String(copyIdToInsert)],
        connection
      );
      const procedureResult = rows[0] || {};
      const errorMessage = procedureResult.error_message || (
        !/success/i.test(String(procedureResult.message || ''))
          ? procedureResult.message
          : ''
      );

      if (errorMessage) {
        results.push({ copyCode: String(copyIdToInsert), status: 'FAILED', message: errorMessage });
        continue;
      }

      const createdCopyId = parseCopyId(procedureResult.copy_id) || copyIdToInsert;
      const createdCopy = await getCopyById(createdCopyId, connection);

      if (!createdCopy) {
        results.push({
          id: Number(createdCopyId),
          book_id: Number(bookId),
          copy_code: String(createdCopyId),
          status: CLIENT_AVAILABLE_STATUS,
          message: procedureResult.message || 'Book copy added successfully',
        });
        continue;
      }

      results.push({
        ...mapCopyToClient(createdCopy),
        message: procedureResult.message || 'Book copy added successfully',
      });
    }

    return results;
  } finally {
    connection.release();
  }
};

const getBookCopies = async (bookId) => {
  const normalizedBookId = Number(bookId);
  if (!Number.isInteger(normalizedBookId) || normalizedBookId <= 0) {
    throw { status: 400, message: 'Invalid book ID' };
  }

  const [rows] = await pool.query(
    `
      SELECT copy_id, book_id, status
      FROM book_copies
      WHERE book_id = ?
      ORDER BY copy_id ASC
    `,
    [normalizedBookId]
  );

  return rows.map(mapCopyToClient);
};

const updateCopyStatus = async (copyId, newStatus, loggedUserId) => {
  const normalizedCopyId = parseCopyId(copyId);
  if (!normalizedCopyId) {
    throw { status: 400, message: 'Copy ID must be a positive number' };
  }

  const requestedStatus = normalizeStatus(newStatus);
  const validStatuses = [CLIENT_AVAILABLE_STATUS, CLIENT_UNAVAILABLE_STATUS];

  if (!validStatuses.includes(requestedStatus)) {
    throw { status: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }

  const rows = await callProcedure(
    'update_book_copy_status',
    [Number(loggedUserId), normalizedCopyId, toDatabaseStatus(requestedStatus)]
  );
  const procedureResult = rows[0] || {};

  if (!/success/i.test(String(procedureResult.message || ''))) {
    throw {
      status: mapProcedureMessageToError(procedureResult.message),
      message: procedureResult.message || 'Failed to update copy status',
    };
  }

  const updatedCopy = await getCopyById(normalizedCopyId);
  if (!updatedCopy) {
    throw { status: 404, message: 'Book copy not found' };
  }

  return mapCopyToClient(updatedCopy);
};

const updateCopyCode = async (copyId, newCopyCode) => {
  const connection = await pool.getConnection();

  try {
    const normalizedCurrentCopyId = parseCopyId(copyId);
    const normalizedNewCopyId = parseCopyId(newCopyCode);

    if (!normalizedCurrentCopyId || !normalizedNewCopyId) {
      throw { status: 400, message: 'Copy ID must be a positive number' };
    }

    const currentCopy = await getCopyById(normalizedCurrentCopyId, connection);
    if (!currentCopy) {
      throw { status: 404, message: 'Book copy not found' };
    }

    if (Number(currentCopy.copy_id) === normalizedNewCopyId) {
      throw { status: 400, message: 'Copy ID is the same; cannot be updated' };
    }

    const duplicateCopy = await getCopyById(normalizedNewCopyId, connection);
    if (duplicateCopy) {
      throw { status: 409, message: 'Copy ID already exists' };
    }

    await connection.query(
      `
        UPDATE book_copies
        SET copy_id = ?
        WHERE copy_id = ?
      `,
      [normalizedNewCopyId, normalizedCurrentCopyId]
    );

    const updatedCopy = await getCopyById(normalizedNewCopyId, connection);
    if (!updatedCopy) {
      throw { status: 500, message: 'Copy ID updated but row could not be loaded' };
    }

    return mapCopyToClient(updatedCopy);
  } finally {
    connection.release();
  }
};

const deleteCopy = async (copyId, loggedUserId) => {
  const connection = await pool.getConnection();

  try {
    const normalizedCopyId = parseCopyId(copyId);
    if (!normalizedCopyId) {
      throw { status: 400, message: 'Copy ID must be a positive number' };
    }

    const copy = await getCopyById(normalizedCopyId, connection);
    if (!copy) {
      throw { status: 404, message: 'Book copy not found' };
    }

    const rows = await callProcedure(
      'delete_book_copy',
      [Number(loggedUserId), Number(copy.book_id), normalizedCopyId],
      connection
    );
    const procedureResult = rows[0] || {};

    if (!/success/i.test(String(procedureResult.message || ''))) {
      throw {
        status: mapProcedureMessageToError(procedureResult.message),
        message: procedureResult.message || 'Failed to delete copy',
      };
    }

    return { message: procedureResult.message };
  } finally {
    connection.release();
  }
};

const searchByCallNumber = async (copyCode) => {
  const normalizedCopyId = parseCopyId(copyCode);
  if (!normalizedCopyId) {
    throw { status: 400, message: 'Copy ID must be a positive number' };
  }

  const [rows] = await pool.query(
    `
      SELECT
        bc.copy_id AS id,
        bc.copy_id AS copy_code,
        bc.status,
        bc.book_id,
        b.title,
        a.author_name AS author,
        b.publisher,
        b.language
      FROM book_copies bc
      JOIN books b ON b.book_id = bc.book_id
      LEFT JOIN authors a ON a.author_id = b.author_id
      WHERE bc.copy_id = ?
      LIMIT 1
    `,
    [normalizedCopyId]
  );

  if (rows.length === 0) {
    throw { status: 404, message: 'Copy not found' };
  }

  return {
    ...rows[0],
    status: toClientStatus(rows[0].status),
    id: Number(rows[0].id),
    copy_code: String(rows[0].copy_code),
    book_id: Number(rows[0].book_id),
  };
};

module.exports = {
  addBookCopies,
  getBookCopies,
  updateCopyStatus,
  updateCopyCode,
  deleteCopy,
  searchByCallNumber,
};
