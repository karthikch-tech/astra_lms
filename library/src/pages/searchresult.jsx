import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { api } from "../config/api";
import "./searchresult.css";

function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") || "";
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const searchBooks = async () => {
      setLoading(true);
      try {
        const data = await api.books.list({ title: query });
        if (isMounted) {
          setBooks(data);
        }
      } catch (error) {
        if (isMounted) {
          alert(error.message || "Search failed");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    searchBooks();
    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <div className="results">
      <h2>Search Results for "{query}"</h2>
      {loading ? <p>Searching...</p> : null}
      {!loading && books.length === 0 ? <p>No books found.</p> : null}
      {books.map((book) => (
        <div key={book.id} className="book-card">
          <h3>{book.title}</h3>
          <p>{book.author}</p>
          <Link to={`/book/${book.id}`}>View Details</Link>
        </div>
      ))}
    </div>
  );
}

export default SearchResults;
