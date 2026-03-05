const {
  addBookCopies,
  getBookCopies,
  updateCopyStatus,
  updateCopyCode,
  deleteCopy,
  searchByCallNumber,
} = require('../services/copy.service');

const addCopies = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { copyIds } = req.body;

    if (!Array.isArray(copyIds) || copyIds.length === 0) {
      return res.status(400).json({ message: 'copyIds must be a non-empty array' });
    }

    const results = await addBookCopies(bookId, copyIds);
    res.status(201).json({ message: 'Copies added', results });
  } catch (error) {
    next(error);
  }
};

const getCopies = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const copies = await getBookCopies(bookId);
    res.status(200).json(copies);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { copyId } = req.params;
    const { status, copyCode } = req.body;

    if (copyCode !== undefined) {
      const updated = await updateCopyCode(copyId, copyCode);
      return res.status(200).json({ message: 'Copy code updated successfully', copy: updated });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status or copyCode is required' });
    }

    const updated = await updateCopyStatus(copyId, status);
    return res.status(200).json({ message: 'Status updated successfully', copy: updated });
  } catch (error) {
    return next(error);
  }
};

const deleteCopyHandler = async (req, res, next) => {
  try {
    const { copyId } = req.params;
    await deleteCopy(copyId);
    res.status(200).json({ message: 'Copy deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const searchCopy = async (req, res, next) => {
  try {
    const { copyCode } = req.query;

    if (!copyCode) {
      return res.status(400).json({ message: 'Copy code is required' });
    }

    const copy = await searchByCallNumber(copyCode);
    res.status(200).json(copy);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addCopies,
  getCopies,
  updateStatus,
  deleteCopyHandler,
  searchCopy,
};
