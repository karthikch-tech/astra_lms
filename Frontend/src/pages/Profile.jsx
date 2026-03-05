import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import styles from "./Profile.module.css";
import AppContext from "../context/AppContext";
import { api } from "../config/api";

const Profile = () => {
  const { user, logout, updateUser } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const profile = await api.auth.getMe();
        if (isMounted) {
          updateUser(profile);
        }
      } catch (error) {
        if (isMounted && error.status === 401) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>{user.username?.charAt(0)?.toUpperCase() || "U"}</div>
            <div className={styles.userInfo}>
              <h2>
                {user.firstName} {user.lastName}
              </h2>
              <p className={styles.username}>@{user.username}</p>
              <p>{user.role}</p>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>

        <div className={styles.userSection}>
          <h3>User Information</h3>
          {loading ? <p>Refreshing profile...</p> : null}

          <div className={styles.inputGroup}>
            <label>First Name</label>
            <input type="text" value={user.firstName || ""} disabled />
          </div>
          <div className={styles.inputGroup}>
            <label>Last Name</label>
            <input type="text" value={user.lastName || ""} disabled />
          </div>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input type="text" value={user.username || ""} disabled />
          </div>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="text" value={user.email || ""} disabled />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
