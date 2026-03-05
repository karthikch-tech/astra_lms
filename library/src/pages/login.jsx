import "./auth.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import AppContext from "../context/AppContext";
import { api } from "../config/api";

function Login() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLogin = location.pathname.startsWith("/admin");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login({
        emailOrUsername: identifier,
        password,
      });

      if (isAdminLogin && response.user.role !== "ADMIN") {
        alert("This account is not an admin account");
        return;
      }

      login(response);
      navigate(response.user.role === "ADMIN" ? "/admin/dashboard" : "/home");
    } catch (error) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
            onChange={(event) => setIdentifier(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button className="auth-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {isAdminLogin ? (
            <p>
              Don&apos;t have an admin account? <Link to="/admin/register">Register</Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Login;
