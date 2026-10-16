import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/endpoints";
import toast from "react-hot-toast";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved && saved !== "undefined" && saved !== "null"
        ? JSON.parse(saved)
        : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("accessToken")
  );
  // If user and token already exist, render instantly without blocking spinner!
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("accessToken");
    const saved = localStorage.getItem("user");
    return Boolean(token && (!saved || saved === "undefined" || saved === "null"));
  });
  const [currentDemoRole, setCurrentDemoRole] = useState(() =>
    localStorage.getItem("demoRole") || null
  );

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res?.data && isMounted) {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (err) {
        // If 401 Unauthorized, session has expired
        if (err.response?.status === 401 && isMounted) {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      const { user: loggedInUser, accessToken: token } = res.data;
      setUser(loggedInUser);
      setAccessToken(token);
      setCurrentDemoRole(null);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      localStorage.setItem("accessToken", token);
      localStorage.removeItem("demoRole");
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      return loggedInUser;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      const { user: newUser, accessToken: token } = res.data;
      setUser(newUser);
      setAccessToken(token);
      setCurrentDemoRole(null);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("accessToken", token);
      localStorage.removeItem("demoRole");
      toast.success("Account created successfully!");
      return newUser;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      setCurrentDemoRole(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("demoRole");
      toast.success("Logged out successfully");
    }
  };

  const switchDemoRole = async (role) => {
    try {
      setLoading(true);
      const res = await authApi.demoLogin(role);
      const { user: demoUser, accessToken: token, demoRole } = res.data;
      setUser(demoUser);
      setAccessToken(token);
      setCurrentDemoRole(demoRole);
      localStorage.setItem("user", JSON.stringify(demoUser));
      localStorage.setItem("accessToken", token);
      localStorage.setItem("demoRole", demoRole);
      toast.success(`Switched role to ${role.toUpperCase()} (${demoUser.name})`);
      return demoUser;
    } catch (err) {
      const msg = err.response?.data?.message || `Demo login for ${role} failed`;
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    currentDemoRole,
    login,
    register,
    logout,
    switchDemoRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
