import "./auth.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import AppContext from "../context/AppContext";

function Login() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminLogin = location.pathname.startsWith("/admin");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!identifier || !password) {
      alert("Please fill all fields");
      return;
    }

    login({
      username: identifier,
      isAdmin: isAdminLogin
    });

    // ✅ AFTER LOGIN → GO TO HOME (USER) OR ADMIN DASHBOARD
    navigate(isAdminLogin ? "/admin/dashboard" : "/home");
  };

  return (
    <div className="auth">
      <div className="overlay">
        <div className="auth-card">
          <h1>{isAdminLogin ? "Admin Login" : "User Login"}</h1>

          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-btn" onClick={handleLogin}>
            Login
          </button>

          {/* ✅ ONLY ADMIN CAN REGISTER */}
          {isAdminLogin && (
            <p>
              Don’t have an admin account?{" "}
              <Link to="/admin/register">Register</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;