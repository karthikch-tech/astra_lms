import { useEffect, useMemo, useState } from "react";
import { api } from "../config/api";
import styles from "./AdminUsers.module.css";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  role: "USER",
  password: "",
  confirmPassword: "",
};

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (error) {
      alert(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) {
      return users;
    }

    return users.filter((user) =>
      [user.firstName, user.lastName, user.email, user.username, user.role]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [searchText, users]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setEditingUserId(null);
    setForm(initialForm);
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      password: "",
      confirmPassword: "",
    });
  };

  const validateForm = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.username || !form.role) {
      alert("Please fill all required fields");
      return false;
    }

    if (editingUserId === null && !form.password) {
      alert("Password is required for new users");
      return false;
    }

    if (form.password && form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      role: form.role,
      password: form.password,
    };

    try {
      if (editingUserId === null) {
        await api.users.create(payload);
        alert("User created successfully");
      } else {
        await api.users.update(editingUserId, payload);
        alert("User updated successfully");
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      alert(error.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const isConfirmed = window.confirm(`Delete user "${user.username}"?`);
    if (!isConfirmed) {
      return;
    }

    try {
      await api.users.remove(user.id);
      if (editingUserId === user.id) {
        resetForm();
      }
      await loadUsers();
    } catch (error) {
      alert(error.message || "Failed to delete user");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Users</h1>
          <p>Add, update, and delete users from the admin panel.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2>{editingUserId === null ? "Add User" : "Edit User"}</h2>

          <div className={styles.formGrid}>
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
            />
            <select name="role" value={form.role} onChange={handleChange} required>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <input
              name="password"
              type="password"
              placeholder={editingUserId === null ? "Password" : "New Password (optional)"}
              value={form.password}
              onChange={handleChange}
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder={editingUserId === null ? "Confirm Password" : "Confirm New Password"}
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? "Saving..." : editingUserId === null ? "Add User" : "Update User"}
            </button>
            {editingUserId !== null ? (
              <button className={styles.secondaryButton} type="button" onClick={resetForm} disabled={saving}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h2>Users ({filteredUsers.length})</h2>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name, email, username, role"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          {loading ? <p className={styles.loading}>Loading users...</p> : null}

          {!loading && filteredUsers.length === 0 ? (
            <p className={styles.empty}>No users found.</p>
          ) : null}

          {!loading && filteredUsers.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{`${user.firstName} ${user.lastName}`}</td>
                      <td>{user.email}</td>
                      <td>{user.username}</td>
                      <td>
                        <span className={user.role === "ADMIN" ? styles.roleAdmin : styles.roleUser}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button" onClick={() => startEdit(user)}>
                            Edit
                          </button>
                          <button type="button" className={styles.deleteButton} onClick={() => handleDelete(user)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
