import "./auth.css";
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { api } from "../config/api";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRegister = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminRegister) {
      navigate("/login");
    }
  }, [isAdminRegister, navigate]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleRegister = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.username ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (isAdminRegister) {
        await api.auth.registerAdmin(form);
      } else {
        await api.auth.register(form);
      }

      alert("Registration successful. Please login.");
      navigate(isAdminRegister ? "/admin/login" : "/login");
    } catch (error) {
      alert(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="overlay">
        <div className="auth-card">
          <h1>{isAdminRegister ? "Admin Register" : "Register"}</h1>

          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
          <input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <button className="auth-btn" onClick={handleRegister} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p>
            Already have an account?{" "}
            <Link to={isAdminRegister ? "/admin/login" : "/login"}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
