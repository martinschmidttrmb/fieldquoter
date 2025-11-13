/**
 * Navigation Bar Component
 * Displays navigation links and user info
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout, impersonating } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null; // Don't show navbar on login page
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">Field Quoter</Link>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/quotes">Quotes</Link>
        <Link to="/quotes/new">New Quote</Link>
        {user.role === 'admin' && <Link to="/users">Users</Link>}
      </div>

      <div className="navbar-user">
        {impersonating && (
          <span className="impersonation-badge">Impersonating</span>
        )}
        <div className="user-info">
          <span className="user-name">
            {user.firstName} {user.lastName}
          </span>
          <span className="role-badge">{user.role}</span>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

