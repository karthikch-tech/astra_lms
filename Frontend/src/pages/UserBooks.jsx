import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import styles from "./AdminPage.module.css";

function UserBooks() {
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
      <h1 style={{ padding: "40px 60px", color: "white" }}>Books</h1>

      {loading ? <p style={{ color: "white", paddingLeft: "60px" }}>Loading...</p> : null}
      <div className={styles.booksGrid}>
        {books.length === 0 && !loading ? (
          <p style={{ color: "white", paddingLeft: "60px" }}>No books found.</p>
        ) : (
          books.map((book) => (
            <div key={book.id} className={styles.bookCard}>
              <h3>{book.title}</h3>
              <p>{book.author}</p>

              <button className={styles.viewBtn} onClick={() => navigate(`/book/${book.id}`)}>
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserBooks;
