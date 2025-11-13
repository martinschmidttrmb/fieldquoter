/**
 * Main App component
 * Handles routing and authentication state
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import QuoteBuilder from './components/QuoteBuilder';
import QuoteView from './components/QuoteView';
import QuotesList from './components/QuotesList';
import UsersList from './components/UsersList';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Protected Route component - requires authentication
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin Route component - requires admin role
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Main App Routes
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotes"
        element={
          <ProtectedRoute>
            <QuotesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotes/new"
        element={
          <ProtectedRoute>
            <QuoteBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotes/:id"
        element={
          <ProtectedRoute>
            <QuoteView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UsersList />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="main-content">
            <AppRoutes />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

