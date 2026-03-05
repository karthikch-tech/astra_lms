import { createContext, useMemo, useState } from "react";

const AppContext = createContext(null);

const readStoredAuth = () => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
  };
};

export const AppProvider = ({ children }) => {
  const initialAuth = readStoredAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);

  const login = (authPayload) => {
    if (!authPayload?.token || !authPayload?.user) {
      return;
    }

    setToken(authPayload.token);
    setUser(authPayload.user);
    localStorage.setItem("token", authPayload.token);
    localStorage.setItem("user", JSON.stringify(authPayload.user));
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === "ADMIN",
      login,
      logout,
      updateUser,
    }),
    [token, user]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export default AppContext;
