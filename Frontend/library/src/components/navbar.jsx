import { Link, useLocation, useNavigate } from "react-router-dom";

import { useContext } from "react";
import AppContext from "../context/AppContext";
import "./navbar.css";

function Navbar() {
  const { user } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 Detect if we are inside admin panel area
  const isAdminArea = location.pathname.startsWith("/admin") || location.pathname.startsWith("/add-book");

  return (
    <header className="navbar">
      <div className="left-section">
  <div className="back-arrow" onClick={() => navigate(-1)}>
    ←
  </div>

  <div className="logo">
    <Link to="/home" className="logo-link">ASTRA</Link>
  </div>
</div>

      <nav className="nav-links">

        {isAdminArea ? (
          // 🔥 ADMIN STYLE NAVBAR (Always)
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            

            
            {user && (
  <Link to={isAdminArea ? "/admin/profile" : "/profile"}>
    Profile
  </Link>
)}

            {!user && (
              <>
                <Link to="/admin/login">Login</Link>
                <Link to="/admin/register">Register</Link>
                 
              </>
                

            )}
          </>
        ) : (
          // 🔥 NORMAL USER NAVBAR
          <>
            <Link to="/home">Home</Link>
            
            <Link to="/about">About</Link>

            {!user ? (
              <>
                <Link to="/login">Login</Link>
               
              </>
            ) : (
              <>
                <Link to="/profile">Profile</Link>
               
               
              </>
            )}
          </>
        )}

      </nav>
    </header>
  );
}

export default Navbar;