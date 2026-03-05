import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import styles from "./AdminPage.module.css";

function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      try {
        const data = await api.books.list();
        if (isMounted) {
          setBooks(data);
        }
      } catch (error) {
        if (isMounted) {
          alert(error.message || "Failed to load books");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.heading}>All Books</h1>
      {loading ? <p style={{ color: "white", paddingLeft: "60px" }}>Loading...</p> : null}

      <div className={styles.booksGrid}>
        {books.map((book) => (
          <div className={styles.bookCard} key={book.id}>
            <div className={styles.bookImage}>
              <img
                src={book.cover_image_url || "https://via.placeholder.com/140x210?text=No+Image"}
                alt={book.title}
              />
            </div>

            <div className={styles.bookBody}>
              <h3>{book.title}</h3>

              <p>
                <strong>Author:</strong> {book.author}
              </p>
              <p>
                <strong>Category:</strong> {book.category_name || "N/A"}
              </p>
              <p>
                <strong>Language:</strong> {book.language || "N/A"}
              </p>
              <p>
                <strong>Available:</strong> {book.available_copies || 0}
              </p>
            </div>

            <div className={styles.bookFooter}>
              <button className={styles.viewBtn} onClick={() => navigate(`/admin/book/${book.id}`)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBooks;
