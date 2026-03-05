import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../config/api";
import styles from "./AdminPage.module.css";

const AdminPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      try {
        const [booksData, usersData] = await Promise.all([api.books.list(), api.users.list()]);
        if (isMounted) {
          setBooks(booksData);
          setUsers(usersData);
        }
      } catch (error) {
        if (isMounted) {
          alert(error.message || "Failed to load dashboard data");
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

  const totalBooks = books.length;
  const totalUsers = users.length;
  const totalCopies = books.reduce((total, book) => total + Number(book.total_copies || 0), 0);
  const availableBooks = books.filter((book) => Number(book.available_copies || 0) > 0).length;
  const unavailableBooks = books.filter((book) => Number(book.available_copies || 0) === 0).length;

  return (
    <div className={styles.dashboard}>
      <div className={styles.leftTitle}>
        <h1>
          <i>Admin Dashboard</i>
        </h1>
      </div>

      <div className={styles.centerContent}>
        {loading ? <p style={{ color: "white" }}>Loading...</p> : null}

        <div className={styles.statsGrid}>
          <button type="button" className={styles.card} onClick={() => navigate("/admin/books")}>
            <h3>
              <i>Total Books</i>
            </h3>
            <p>{totalBooks}</p>
          </button>

          <button type="button" className={styles.card} onClick={() => navigate("/admin/users")}>
            <h3>
              <i>Total Users</i>
            </h3>
            <p>{totalUsers}</p>
          </button>

          <div className={styles.card}>
            <h3>
              <i>Total Copies</i>
            </h3>
            <p>{totalCopies}</p>
          </div>

          <div className={styles.card}>
            <h3>
              <i>Available Books</i>
            </h3>
            <p>{availableBooks}</p>
          </div>

          <div className={styles.card}>
            <h3>
              <i>Unavailable Books</i>
            </h3>
            <p>{unavailableBooks}</p>
          </div>
        </div>

        <div className={styles.addButtonWrapper}>
          <button type="button" className={styles.addButton} onClick={() => navigate("/admin/add-book")}>
            + Add Book
          </button>
          <button type="button" className={styles.addButton} onClick={() => navigate("/admin/users")}>
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
