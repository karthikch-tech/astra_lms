import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import AppContext from "../context/AppContext";
import "./home.css";

function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AppContext);

  const handleSearch = () => {
    if (query.trim() !== "") {
      navigate(`/search?q=${query}`);
    }
  };

  const books = [
    {
      id: 1,
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self-help",
      language: "English"
    },
    {
      id: 2,
      title: "The Alchemist",
      author: "Paulo Coelho",
      category: "Fiction",
      language: "English"
    },
    {
      id: 3,
      title: "Rich Dad Poor Dad",
      author: "Robert Kiyosaki",
      category: "Finance",
      language: "English"
    },
    {
      id: 4,
      title: "Think and Grow Rich",
      author: "Napoleon Hill",
      category: "Success",
      language: "English"
    }
  ];

  return (
    <div className="home">

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="overlay">
          <div className="hero">
            <h1>Find Your Book of Choice.</h1>
            <p>
              Discover thousands of books from different categories and authors.
            </p>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search books..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={handleSearch}>
                <FaSearch />
              </button>
            </div>

            {user?.role === "admin" && (
              <button
                className="dashboard-btn"
                onClick={() => navigate("/admin")}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* BOOKS SECTION */}
      <section className="books-section">
        <h2>Featured Books</h2>

        <div className="booksGrid">
          {books.map((book) => (
            <div className="bookCard" key={book.id}>

              <div className="bookImage">
                <img
                  src={
                    book.image ||
                    "https://via.placeholder.com/180x260?text=No+Image"
                  }
                  alt={book.title}
                />
              </div>

              <div className="bookBody">
                <h3>{book.title}</h3>
                <p><strong>Author:</strong> {book.author}</p>
                <p>category: {book.category}</p>
                <p>language: {book.language}</p>
              </div>

              <div className="bookFooter">
                <button
                  className="viewBtn"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
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
