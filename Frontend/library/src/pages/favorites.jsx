import { useNavigate } from "react-router-dom";
import "./favorites.css";

function Favorites() {

  const navigate = useNavigate();

  const favoriteBooks = [
    { 
      id: 1, 
      title: "Atomic Habits", 
      author: "James Clear",
      description: "A guide to building good habits.",
      previewLink: "https://www.google.com"
    },
    { 
      id: 2, 
      title: "The Alchemist", 
      author: "Paulo Coelho",
      description: "A novel about destiny.",
      previewLink: "https://www.google.com"
    },
    { 
      id: 3, 
      title: "Rich Dad Poor Dad", 
      author: "Robert Kiyosaki",
      description: "Finance and investment lessons.",
      previewLink: "https://www.google.com"
    },
    { 
      id: 4, 
      title: "Think and Grow Rich", 
      author: "Napoleon Hill",
      description: "Success mindset principles.",
      previewLink: "https://www.google.com"
    }
  ];

  const handleViewDetails = (book) => {
    navigate(`/book/${book.id}`, { state: book });
  };

  const handleRemove = (bookId) => {
    alert("Remove book with ID: " + bookId);
  };

  return (
    <div className="favorites-page">

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="overlay">
          <div className="hero">
            <h1>Your Favorite Books.</h1>
            <p>All your saved books in one place.</p>
          </div>
        </div>
      </section>

      {/* BOOKS SECTION */}
      <section className="favorites-books">
        <h2>Favorites Collection</h2>

        <div className="books-grid">
          {favoriteBooks.map((book) => (
            <div
              className="book-card"
              key={book.id}
              onClick={() => handleViewDetails(book)}   // ✅ CARD CLICK
            >
              <div className="book-cover"></div>
              <h3>{book.title}</h3>
              <p>{book.author}</p>

              <button
                className="view-btn"
                onClick={(e) => {
                  e.stopPropagation();   // ✅ STOP CARD CLICK
                  handleRemove(book.id);
                }}
              >
                Remove
              </button>

            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Favorites;