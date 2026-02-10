import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { jwtDecode } from "jwt-decode";
import { logoutApi } from "../api/authApi";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem("token")) return null;
    try {
      return jwtDecode(localStorage.getItem("token"));
    } catch {
      return null;
    }
  });

  const logout = async () => {
    try {
      if (token) {
        await logoutApi(token);
      }
    } catch (err) {
      // Even if API fails, force logout
      console.warn("Logout API failed, clearing session");
      return err;
    } finally {
      localStorage.clear();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, user, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
