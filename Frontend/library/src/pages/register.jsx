import "./auth.css";
import { useState, useContext, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import AppContext from "../context/AppContext";

function Register() {
  const { login } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Allow only /admin/register
  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      navigate("/login");
    }
  }, [location, navigate]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.username ||
      !form.email ||
      !form.password ||
      form.password !== form.confirmPassword
    ) {
      alert("Please fill all fields correctly");
      return;
    }

    // ✅ Always admin
    login({
      ...form,
      isAdmin: true,
    });

    navigate("/admin");
  };

  return (
    <div className="auth">
      <div className="overlay">
        <div className="auth-card">
          <h1>Admin Register</h1>

          <input
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Last Name"
            onChange={handleChange}
          />
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="admin@gmail.com"
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            onChange={handleChange}
          />

          <button className="auth-btn" onClick={handleRegister}>
            Register
          </button>

          <p>
            Already have admin account?{" "}
            <Link to="/admin/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;