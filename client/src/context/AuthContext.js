/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user info
      axios.get('/auth/me')
        .then(response => {
          setUser(response.data);
          // Check if impersonating
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          if (tokenData.isImpersonating) {
            setImpersonating(true);
          }
        })
        .catch(error => {
          // Token invalid, remove it
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Login function
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setImpersonating(false);
  };

  /**
   * Impersonate user (Admin only)
   */
  const impersonate = async (userId) => {
    try {
      const response = await axios.post('/auth/impersonate', { userId });
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
      setImpersonating(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Impersonation failed'
      };
    }
  };

  /**
   * Stop impersonating and return to admin account
   */
  const stopImpersonating = () => {
    logout();
    // Admin will need to log in again or we could store their original token
    // For simplicity, we'll just log them out
  };

  const value = {
    user,
    loading,
    impersonating,
    login,
    logout,
    impersonate,
    stopImpersonating
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

