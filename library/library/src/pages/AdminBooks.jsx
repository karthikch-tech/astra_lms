import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";

function AdminBooks() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("books");

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBooks(parsed);
        return;
      }
    }

    const defaultBooks = [
      { id: 1, title: "Atomic Habits", author: "James Clear" },
      { id: 2, title: "The Alchemist", author: "Paulo Coelho" },
      { id: 3, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki" },
      { id: 4, title: "The Psychology of Money", author: "Morgan Housel" },
    ];

    localStorage.setItem("books", JSON.stringify(defaultBooks));
    setBooks(defaultBooks);
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.heading}>All Books</h1>

      <div className={styles.booksGrid}>
        {books.map((book) => (
          <div className={styles.bookCard} key={book.id}>

            <div className={styles.bookImage}>
              <img
                src={
                  book.image ||
                  "https://via.placeholder.com/140x210?text=No+Image"
                }
                alt={book.title}
              />
            </div>

            <div className={styles.bookBody}>
              <h3>{book.title}</h3>

              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>category:</strong> {book.category || "N/A"}</p>
               <p><strong>language:</strong> {book.language || "N/A"}</p>   
              
            </div>

            <div className={styles.bookFooter}>
              <button
                className={styles.viewBtn}
                onClick={() => navigate(`/admin/book/${book.id}`)}
              >
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