import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set token in axios defaults
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Verify token is valid
        const response = await api.get("/auth/verify");
        setCurrentUser(response.data.user);
      } catch (error) {
        // If token is invalid, clear everything
        console.error("Token verification failed:", error);
        localStorage.removeItem("token");
        setToken(null);
        delete api.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token, user } = response.data;

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Set token in axios defaults
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update state
      setToken(token);
      setCurrentUser(user);

      return user;
    } catch (error) {
      console.error("Login failed:", error);
      // Optionally, you can handle specific error cases here
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");

    // Remove token from axios defaults
    delete api.defaults.headers.common["Authorization"];

    // Update state
    setToken(null);
    setCurrentUser(null);
  };

  // Register function
  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    const { token, user } = response.data;

    // Save token to localStorage
    localStorage.setItem("token", token);

    // Set token in axios defaults
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Update state
    setToken(token);
    setCurrentUser(user);

    return user;
  };

  // Value object that will be passed to consumers
  const value = {
    currentUser,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
