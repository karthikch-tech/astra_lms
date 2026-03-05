import { useContext, useState, useEffect } from "react";
import AppContext from "../context/AppContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./bookdetails.css";

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AppContext);

  const [books, setBooks] = useState([]);
  const [book, setBook] = useState(null);

  const [showCopiesMenu, setShowCopiesMenu] = useState(false);
  const [showAddCopy, setShowAddCopy] = useState(false);
  const [showUpdateCopy, setShowUpdateCopy] = useState(false);
  const [newCopyId, setNewCopyId] = useState("");

  const isAdminRoute = location.pathname.startsWith("/admin/book");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("books")) || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBooks(saved);
    const found = saved.find((b) => String(b.id) === id);
    setBook(found);
  }, [id]);

  if (!book) return <h2 style={{ padding: "40px" }}>No Book Data Found</h2>;

  const copies = Array.isArray(book.copies) ? book.copies : [];

  // ✅ USER AVAILABILITY LOGIC
  const availableCopies = copies.filter(
    (c) => c.status === "available"
  );

  const isAvailable = availableCopies.length > 0;

  // =========================
  // ADMIN FUNCTIONS
  // =========================

  const handleAddCopy = () => {
    if (!newCopyId.trim()) return;

    const updatedBooks = books.map((b) => {
      if (String(b.id) === id) {
        const updatedCopies = [
          ...copies,
          { copyId: newCopyId, status: "available" }
        ];
        return { ...b, copies: updatedCopies };
      }
      return b;
    });

    localStorage.setItem("books", JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
    setBook(updatedBooks.find((b) => String(b.id) === id));
    setNewCopyId("");
  };

  const toggleStatus = (copyId) => {
    const updatedBooks = books.map((b) => {
      if (String(b.id) === id) {
        const updatedCopies = b.copies.map((c) =>
          c.copyId === copyId
            ? {
                ...c,
                status:
                  c.status === "available"
                    ? "unavailable"
                    : "available"
              }
            : c
        );
        return { ...b, copies: updatedCopies };
      }
      return b;
    });

    localStorage.setItem("books", JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
    setBook(updatedBooks.find((b) => String(b.id) === id));
  };

  const deleteCopy = (copyId) => {
    const updatedBooks = books.map((b) => {
      if (String(b.id) === id) {
        const updatedCopies = b.copies.filter(
          (c) => c.copyId !== copyId
        );
        return { ...b, copies: updatedCopies };
      }
      return b;
    });

    localStorage.setItem("books", JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
    setBook(updatedBooks.find((b) => String(b.id) === id));
  };

  return (
    <div className={`book-details ${isAdminRoute ? "admin-view" : "user-view"}`}>
      <div className="details-container">

        {/* LEFT IMAGE */}
        <div className="details-left">
          <div className="book-image">
            {book.image ? (
              <img
                src={book.image.replace("zoom=1", "zoom=2")}
                alt={book.title}
                onError={(e) =>
                  (e.target.src =
                    "https://via.placeholder.com/320x480?text=No+Image")
                }
              />
            ) : (
              <div className="no-image">No Image</div>
            )}
          </div>
        </div>

        {/* RIGHT INFO */}
        <div className="details-right">
          <h1 className="book-title">{book.title}</h1>

          <p><b>Author:</b> {book.author}</p>
          <p><b>ISBN:</b> {book.isbn}</p>
          <p><b>Category:</b> {book.category}</p>
          <p><b>Publisher:</b> {book.publisher}</p>
          <p><b>Language:</b> {book.language}</p>
          <p><b>Price:</b> ₹{book.price}</p>
          <p><b>Total Copies:</b> {copies.length}</p>
          {!user?.isAdmin && (
            <>

            <p>
                <b>Status:</b>{" "}
                <span
                  style={{
                    color: isAvailable ? "light blue" : "darkred",
                    fontWeight: "bold"
                  }}
                >
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
              </p>
            

            
            </>
          )}
          <p><b>Description:</b> {book.description || "No description available."}</p>


          {/* ✅ USER VIEW EXTRA INFO */}
         

          {/* ================= ADMIN CONTROLS ================= */}
          {user?.isAdmin && isAdminRoute && (
            <div className="admin-actions">

              <button
                className="btn btn-primary"
                onClick={() => setShowCopiesMenu(!showCopiesMenu)}
              >
                📚 Copies
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/admin/update-book/${book.id}`)}
              >
                ✏ Edit
              </button>

              <button
                className="btn btn-danger"
                onClick={() => {
                  const updated = books.filter(
                    (b) => String(b.id) !== id
                  );
                  localStorage.setItem("books", JSON.stringify(updated));
                  navigate("/admin/books");
                }}
              >
                🗑 Delete
              </button>

              {showCopiesMenu && (
                <div className="copies-menu">

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddCopy(true);
                      setShowUpdateCopy(false);
                    }}
                  >
                    ➕ Copy Add
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUpdateCopy(true);
                      setShowAddCopy(false);
                    }}
                  >
                    🔄 Copy Update
                  </button>

                  {showAddCopy && (
                    <div className="copy-box">
                      <input
                        type="text"
                        placeholder="Enter Copy ID"
                        value={newCopyId}
                        onChange={(e) =>
                          setNewCopyId(e.target.value)
                        }
                      />
                      <button
                        className="btn btn-success"
                        onClick={handleAddCopy}
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {showUpdateCopy && (
                    <div className="copy-update-list">
                      {copies.map((c) => (
                        <div key={c.copyId} className="copy-row">
                          <span className="copy-id">{c.copyId}</span>

                          <div className="copy-actions">
                            <button
                              className={`toggle-btn ${c.status}`}
                              onClick={() => toggleStatus(c.copyId)}
                            >
                              {c.status === "available"
                                ? "Available"
                                : "Unavailable"}
                            </button>

                            <button
                              className="delete-copy-btn"
                              onClick={() => deleteCopy(c.copyId)}
                            >
                              ✖
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default BookDetails;