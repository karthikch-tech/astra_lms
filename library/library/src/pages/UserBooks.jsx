/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";

function UserBooks() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("books")) || [];
    setBooks(saved);
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1 style={{ padding: "40px 60px", color: "white" }}>
        Books
      </h1>

      <div className={styles.booksGrid}>
        {books.length === 0 ? (
          <p style={{ color: "white", paddingLeft: "60px" }}>
            No books found.
          </p>
        ) : (
          books.map((book) => (
            <div key={book.id} className={styles.bookCard}>
              <h3>{book.title}</h3>
              <p>{book.author}</p>

              <button
                className={styles.viewBtn}
                onClick={() => navigate(`/book/${book.id}`)}
              >
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