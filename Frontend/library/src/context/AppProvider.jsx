import { useState, useEffect } from "react";
import AppContext from "./AppContext";

function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const addToFavorites = (book) => {
    if (!favorites.find((b) => b.id === book.id)) {
      setFavorites([...favorites, book]);
    }
  };

  return (
    <AppContext.Provider
      value={{ user, login, logout, favorites, addToFavorites }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;