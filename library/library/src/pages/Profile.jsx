import React, { useRef, useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import styles from "./Profile.module.css";
import AppContext from "../context/AppContext";

const Profile = () => {
  const { user, logout, updateUser } = useContext(AppContext);
  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState(
    localStorage.getItem("profileAvatar") || null
  );

  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        password: "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (avatar) {
      localStorage.setItem("profileAvatar", avatar);
    }
  }, [avatar]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    localStorage.removeItem("profileAvatar");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const updatedUser = {
      ...user,
      firstName: user.isAdmin ? form.firstName : user.firstName,
      lastName: user.isAdmin ? form.lastName : user.lastName,
      username: form.username,
      email: user.isAdmin ? form.email : user.email,
    };

    updateUser(updatedUser);
    setEditMode(false);
    alert("Profile updated successfully");
  };

  // 🔥 ROLE BASED FIELDS
  const adminFields = ["firstName", "lastName", "username", "email", "password"];
  const userFields = ["username", "password"];

  const fieldsToShow = user.isAdmin ? adminFields : userFields;

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileCard}>

        {/* Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerLeft}>
            <div
              className={styles.avatar}
              onClick={handleAvatarClick}
            >
              {avatar ? (
                <img src={avatar} alt="avatar" />
              ) : (
                user.username?.charAt(0)
              )}
            </div>

            <div className={styles.userInfo}>
              <h2>
                {user.isAdmin
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </h2>

              <p className={styles.username}>@{user.username}</p>

              {editMode && (
                <div className={styles.photoButtons}>
                  <button onClick={handleAvatarClick}>
                    Change Photo
                  </button>
                  {avatar && (
                    <button onClick={removeAvatar}>
                      Remove
                    </button>
                  )}
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                hidden
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div>
            {!editMode ? (
              <button
                className={styles.editBtn}
                onClick={() => setEditMode(true)}
              >
                Edit
              </button>
            ) : (
              <button
                className={styles.cancelBtn}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            )}

            <button
              className={styles.logoutBtn}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className={styles.userSection}>
          <h3>User Information</h3>

          {fieldsToShow.map((field) => (
            <div className={styles.inputGroup} key={field}>
              <label>
                {field === "firstName"
                  ? "First Name"
                  : field === "lastName"
                  ? "Last Name"
                  : field === "username"
                  ? "Username"
                  : field === "email"
                  ? "Email"
                  : "Password"}
              </label>

              <input
                type={field === "password" ? "password" : "text"}
                name={field}
                value={form[field]}
                onChange={handleChange}
                disabled={!editMode}
                placeholder={
                  field === "password" ? "New password" : ""
                }
              />
            </div>
          ))}

          {editMode && (
            <button
              className={styles.saveBtn}
              onClick={handleSave}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;