import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppContext from "../context/AppContext";
import { api } from "../config/api";
import "./bookdetails.css";

const nextStatus = (currentStatus) => {
  if (String(currentStatus || "").toUpperCase() === "AVAILABLE") {
    return "UNAVAILABLE";
  }
  return "AVAILABLE";
};

const toAvailabilityStatus = (status) =>
  String(status || "").toUpperCase() === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";

const toStatusClassName = (status) =>
  toAvailabilityStatus(status) === "AVAILABLE" ? "available" : "unavailable";

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useContext(AppContext);

  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCopyCode, setNewCopyCode] = useState("");
  const [editingCopyId, setEditingCopyId] = useState(null);
  const [editingCopyCode, setEditingCopyCode] = useState("");
  const [savingCopyId, setSavingCopyId] = useState(null);

  const isAdminRoute = location.pathname.startsWith("/admin/book");

  const canManage = isAdmin && isAdminRoute;

  const loadBookData = async () => {
    setLoading(true);
    try {
      const [bookData, copyData] = await Promise.all([api.books.getById(id), api.copies.listByBook(id)]);
      setBook(bookData);
      setCopies(copyData);
    } catch (error) {
      alert(error.message || "Failed to load book details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [id]);

  const availableCopies = useMemo(
    () => copies.filter((copy) => toAvailabilityStatus(copy.status) === "AVAILABLE"),
    [copies]
  );

  const handleAddCopy = async () => {
    if (!newCopyCode.trim()) {
      return;
    }

    try {
      await api.copies.addToBook(id, [newCopyCode.trim()]);
      setNewCopyCode("");
      await loadBookData();
    } catch (error) {
      alert(error.message || "Failed to add copy");
    }
  };

  const handleStatusUpdate = async (copy) => {
    try {
      await api.copies.updateStatus(copy.id, nextStatus(copy.status));
      await loadBookData();
    } catch (error) {
      alert(error.message || "Failed to update copy status");
    }
  };

  const handleStartEditCopy = (copy) => {
    setEditingCopyId(copy.id);
    setEditingCopyCode(copy.copy_code || "");
  };

  const handleCancelEditCopy = () => {
    setEditingCopyId(null);
    setEditingCopyCode("");
  };

  const handleSaveCopyCode = async (copyId) => {
    const normalizedCopyCode = editingCopyCode.trim();
    if (!normalizedCopyCode) {
      alert("Copy code is required");
      return;
    }

    setSavingCopyId(copyId);

    try {
      await api.copies.updateCode(copyId, normalizedCopyCode);
      setEditingCopyId(null);
      setEditingCopyCode("");
      await loadBookData();
    } catch (error) {
      alert(error.message || "Failed to update copy code");
    } finally {
      setSavingCopyId(null);
    }
  };

  const handleDeleteCopy = async (copyId) => {
    try {
      await api.copies.remove(copyId);
      await loadBookData();
    } catch (error) {
      alert(error.message || "Failed to delete copy");
    }
  };

  const handleDeleteBook = async () => {
    const confirmDelete = window.confirm("Delete this book and all its copies?");
    if (!confirmDelete) {
      return;
    }

    try {
      await api.books.remove(id, false);
      navigate("/admin/books");
    } catch (error) {
      alert(error.message || "Failed to delete book");
    }
  };

  if (loading) {
    return <h2 style={{ padding: "40px" }}>Loading...</h2>;
  }

  if (!book) {
    return <h2 style={{ padding: "40px" }}>No Book Data Found</h2>;
  }

  const isAvailable = availableCopies.length > 0;

  return (
    <div className={`book-details ${isAdminRoute ? "admin-view" : "user-view"}`}>
      <div className="details-container">
        <div className="details-left">
          <div className="book-image">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                onError={(event) => {
                  event.currentTarget.src = "https://via.placeholder.com/320x480?text=No+Image";
                }}
              />
            ) : (
              <div className="no-image">No Image</div>
            )}
          </div>
        </div>

        <div className="details-right">
          <h1 className="book-title">{book.title}</h1>

          <p>
            <b>Author:</b> {book.author}
          </p>
          <p>
            <b>ISBN:</b> {book.isbn || "N/A"}
          </p>
          <p>
            <b>Category:</b> {book.category_name || "N/A"}
          </p>
          <p>
            <b>Publisher:</b> {book.publisher}
          </p>
          <p>
            <b>Language:</b> {book.language}
          </p>
          <p>
            <b>Price:</b> Rs. {book.price}
          </p>
          <p>
            <b>Total Copies:</b> {copies.length}
          </p>

          {!canManage ? (
            <p>
              <b>Status:</b>{" "}
              <span style={{ color: isAvailable ? "lightblue" : "darkred", fontWeight: "bold" }}>
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </p>
          ) : null}

          <p>
            <b>Description:</b> {book.description || "No description available."}
          </p>

          {canManage ? (
            <div className="admin-actions">
              <button className="btn btn-secondary" onClick={() => navigate(`/admin/update-book/${book.id}`)}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDeleteBook}>
                Delete
              </button>
            </div>
          ) : null}

          {canManage ? (
            <div className="copies-menu">
              <h3>Manage Copies</h3>
              <div className="copy-box">
                <input
                  type="text"
                  placeholder="Enter Copy Code"
                  value={newCopyCode}
                  onChange={(event) => setNewCopyCode(event.target.value)}
                />
                <button className="btn btn-success" onClick={handleAddCopy}>
                  Add Copy
                </button>
              </div>

              <div className="copy-update-list">
                {copies.map((copy) => (
                  <div key={copy.id} className="copy-row">
                    {editingCopyId === copy.id ? (
                      <input
                        className="copy-id-input"
                        type="text"
                        value={editingCopyCode}
                        onChange={(event) => setEditingCopyCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSaveCopyCode(copy.id);
                          }
                        }}
                      />
                    ) : (
                      <span className="copy-id">{copy.copy_code}</span>
                    )}

                    <div className="copy-actions">
                      {editingCopyId === copy.id ? (
                        <>
                          <button
                            className="edit-copy-btn save-copy-btn"
                            onClick={() => handleSaveCopyCode(copy.id)}
                            disabled={savingCopyId === copy.id}
                          >
                            {savingCopyId === copy.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="edit-copy-btn cancel-copy-btn"
                            onClick={handleCancelEditCopy}
                            disabled={savingCopyId === copy.id}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="edit-copy-btn" onClick={() => handleStartEditCopy(copy)}>
                            Edit
                          </button>
                          <button
                            className={`toggle-btn ${toStatusClassName(copy.status)}`}
                            onClick={() => handleStatusUpdate(copy)}
                          >
                            {toAvailabilityStatus(copy.status)}
                          </button>
                        </>
                      )}

                      <button
                        className="delete-copy-btn"
                        onClick={() => handleDeleteCopy(copy.id)}
                        disabled={savingCopyId === copy.id}
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default BookDetails;
