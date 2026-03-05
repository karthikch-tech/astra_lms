import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import AppContext from "../context/AppContext";
import "./navbar.css";

function Navbar() {
  const { user, isAdmin, logout } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminArea = location.pathname.startsWith("/admin");

  const handleLogout = () => {
    logout();
    navigate(isAdminArea ? "/admin/login" : "/login");
  };

  return (
    <header className="navbar">
      <div className="left-section">
        <button className="back-arrow" type="button" onClick={() => navigate(-1)}>
          {"<"}
        </button>
        <div className="logo">
          <Link to={isAdminArea ? "/admin/dashboard" : "/home"} className="logo-link">
            ASTRA
          </Link>
        </div>
      </div>

      <nav className="nav-links">
        {isAdminArea ? (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/books">Books</Link>
            <Link to="/admin/users">Users</Link>
            {isAdmin ? <Link to="/admin/profile">Profile</Link> : null}
            {isAdmin ? null : <Link to="/admin/login">Login</Link>}
            {isAdmin ? null : <Link to="/admin/register">Register</Link>}
            {isAdmin ? (
              <button type="button" className="logout-link" onClick={handleLogout}>
                Logout
              </button>
            ) : null}
          </>
        ) : (
          <>
            <Link to="/home">Home</Link>
            <Link to="/about">About</Link>
            {user ? <Link to="/profile">Profile</Link> : <Link to="/login">Login</Link>}
            {user ? (
              <button type="button" className="logout-link" onClick={handleLogout}>
                Logout
              </button>
            ) : null}
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
