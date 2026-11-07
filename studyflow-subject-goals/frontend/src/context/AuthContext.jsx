import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studyflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Check auth status on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('studyflow_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosClient.get('/auth/me');
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
        } else {
          logout();
        }
      } catch (err) {
        // Session invalid or expired
        localStorage.removeItem('studyflow_token');
        localStorage.removeItem('studyflow_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('studyflow_token', res.data.token);
      localStorage.setItem('studyflow_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const signup = async (userData) => {
    const res = await axiosClient.post('/auth/signup', userData);
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('studyflow_token', res.data.token);
      localStorage.setItem('studyflow_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (e) {
      // Continue cleanup even if server request fails
    } finally {
      localStorage.removeItem('studyflow_token');
      localStorage.removeItem('studyflow_user');
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('studyflow_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
