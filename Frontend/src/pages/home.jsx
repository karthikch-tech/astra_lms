import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import AppContext from "../context/AppContext";
import { api } from "../config/api";
import "./home.css";

function Home() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useContext(AppContext);

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

  const handleSearch = () => {
    if (query.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="home">
      <section className="hero-section">
        <div className="overlay">
          <div className="hero">
            <h1>Find Your Book of Choice.</h1>
            <p>Discover books from different categories and authors.</p>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search books..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button onClick={handleSearch}>
                <FaSearch />
              </button>
            </div>

            {isAdmin ? (
              <button className="dashboard-btn" onClick={() => navigate("/admin/dashboard")}>
                Go to Dashboard
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="books-section">
        <h2>Featured Books</h2>
        {loading ? <p>Loading books...</p> : null}

        <div className="booksGrid">
          {books.map((book) => (
            <div className="bookCard" key={book.id}>
              <div className="bookImage">
                <img
                  src={book.cover_image_url || "https://via.placeholder.com/180x260?text=No+Image"}
                  alt={book.title}
                />
              </div>

              <div className="bookBody">
                <h3>{book.title}</h3>
                <p>
                  <strong>Author:</strong> {book.author}
                </p>
                <p>Category: {book.category_name || "N/A"}</p>
                <p>Language: {book.language || "N/A"}</p>
              </div>

              <div className="bookFooter">
                <button className="viewBtn" onClick={() => navigate(`/book/${book.id}`)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
