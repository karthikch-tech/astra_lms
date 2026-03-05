import { useLocation, Link } from "react-router-dom";
import "./searchresult.css";

function SearchResults() {
  const query = new URLSearchParams(useLocation().search).get("q");

  const books = [
    { id: 1, title: "React Basics", author: "John Doe" },
    { id: 2, title: "JavaScript Mastery", author: "Jane Smith" }
  ];

  return (
    <div className="results">
      <h2>Search Results for "{query}"</h2>
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