const {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  searchBooks,
  getBookAvailability,
} = require('../services/book.service');
const { addBookCopies } = require('../services/copy.service');
const { persistCoverImage } = require('../utils/coverImage');

const hasValidCreateOrUpdatePayload = (payload) => {
  const requiredTextFields = ['title', 'author', 'publisher', 'language'];
  for (const field of requiredTextFields) {
    if (!payload[field] || String(payload[field]).trim() === '') {
      return false;
    }
  }

  if (payload.categoryId === undefined || payload.categoryId === null || payload.categoryId === '') {
    return false;
  }

  if (payload.price === undefined || payload.price === null || payload.price === '') {
    return false;
  }

  return !Number.isNaN(Number(payload.price));
};

const create = async (req, res, next) => {
  try {
    const {
      title,
      author,
      publisher,
      isbn,
      language,
      price,
      description,
      categoryId,
      coverImageUrl,
      copiesCount,
    } = req.body;

    if (!hasValidCreateOrUpdatePayload({ title, author, publisher, language, price, categoryId })) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const resolvedCoverImageUrl = await persistCoverImage(coverImageUrl, req);
    const loggedUserId = req.user?.id;

    const book = await createBook({
      title,
      author,
      publisher,
      isbn,
      language,
      price: Number(price),
      description,
      categoryId: Number(categoryId),
      coverImageUrl: resolvedCoverImageUrl,
    }, loggedUserId);

    const normalizedCopiesCount = Number(copiesCount || 0);
    const copyPayload = normalizedCopiesCount > 0
      ? Array.from({ length: normalizedCopiesCount }, () => null)
      : [];

    let copyResults = [];
    if (copyPayload.length > 0) {
      copyResults = await addBookCopies(book.id, copyPayload, loggedUserId);
    }

    res.status(201).json({ message: 'Book created successfully', book, copyResults });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { title, author, categoryId } = req.query;

    const filters = {};
    if (title) filters.title = title;
    if (author) filters.author = author;
    if (categoryId) filters.categoryId = categoryId;

    const books = await getAllBooks(filters);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await getBookById(id);
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, publisher, isbn, language, price, description, categoryId, coverImageUrl } = req.body;

    if (!hasValidCreateOrUpdatePayload({ title, author, publisher, language, price, categoryId })) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const resolvedCoverImageUrl = await persistCoverImage(coverImageUrl, req);
    const loggedUserId = req.user?.id;

    const book = await updateBook(id, {
      title,
      author,
      publisher,
      isbn,
      language,
      price: Number(price),
      description,
      categoryId: Number(categoryId),
      coverImageUrl: resolvedCoverImageUrl,
    }, loggedUserId);

    res.status(200).json({ message: 'Book updated successfully', book });
  } catch (error) {
    next(error);
  }
};

const deleteOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loggedUserId = req.user?.id;

    await deleteBook(id, loggedUserId);
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const searchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    const books = await searchBooks(q);
    const suggestions = books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
    }));

    res.status(200).json(suggestions.slice(0, 10));
  } catch (error) {
    next(error);
  }
};

const availability = async (req, res, next) => {
  try {
    const rows = await getBookAvailability();
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  deleteOne,
  searchSuggestions,
  availability,
};
