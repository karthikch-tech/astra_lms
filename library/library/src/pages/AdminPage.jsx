import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";

const AdminPage = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");

  // Load books
  useEffect(() => {
    const savedBooks = JSON.parse(localStorage.getItem("books")) || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBooks(savedBooks);
  }, []);

  const totalBooks = books.length;

  const totalCopies = books.reduce(
    (acc, book) => acc + (Number(book.copies) || 0),
    0
  );

  // Example logic:
  // If copies > 0 → Available
  // If copies === 0 → Unavailable
  const availableBooks = books.filter(
    (book) => Number(book.copies) > 0
  ).length;

  const unavailableBooks = books.filter(
    (book) => Number(book.copies) === 0
  ).length;

  return (
    <div className={styles.dashboard}>
      <div className={styles.leftTitle}>
        <h1><i>Admin Dashboard</i></h1>
      </div>

      <div className={styles.centerContent}>
        {/* Search */}
        <input
          className={styles.search}
          placeholder="Search books"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <button
            type="button"
            className={styles.card}
            onClick={() => navigate("/admin/books")}
          >
            <h3><i>Total Books</i></h3>
            <p>{totalBooks}</p>
          </button>

          <div className={styles.card}>
            <h3><i>Total Copies</i></h3>
            <p>{totalCopies}</p>
          </div>

          <div className={styles.card}>
            <h3><i>Available Books</i></h3>
            <p>{availableBooks}</p>
          </div>

          <div className={styles.card}>
            <h3><i>Unavailable Books</i></h3>
            <p>{unavailableBooks}</p>
          </div>
        </div>

        

        {/* Add Book Button */}
        <div className={styles.addButtonWrapper}>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => navigate("/admin/add-book")}
          >
            + Add Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;