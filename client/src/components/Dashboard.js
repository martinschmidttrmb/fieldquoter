/**
 * Dashboard Component
 * Main dashboard showing overview and quick actions
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    recentQuotes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch quotes
      const quotesResponse = await axios.get('/quotes');
      const quotes = quotesResponse.data;

      // Calculate stats
      const totalQuotes = quotes.length;
      const pendingQuotes = quotes.filter(q => q.status === 'pending_approval').length;
      const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
      const recentQuotes = quotes.slice(0, 5); // Get 5 most recent

      setStats({
        totalQuotes,
        pendingQuotes,
        approvedQuotes,
        recentQuotes
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.firstName}!</h1>
        <p>Here's an overview of your quotes and activity.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Quotes</h3>
          <div className="value">{stats.totalQuotes}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Approval</h3>
          <div className="value">{stats.pendingQuotes}</div>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <div className="value">{stats.approvedQuotes}</div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/quotes/new" className="btn btn-primary">
          Create New Quote
        </Link>
        <Link to="/quotes" className="btn btn-secondary">
          View All Quotes
        </Link>
      </div>

      {stats.recentQuotes.length > 0 && (
        <div className="recent-quotes">
          <h2>Recent Quotes</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Package</th>
                <th>Trucks</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentQuotes.map(quote => (
                <tr key={quote.id}>
                  <td>{quote.customerName}</td>
                  <td>{quote.packageName}</td>
                  <td>{quote.numberOfTrucks}</td>
                  <td>${quote.total.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(quote.status)}`}>
                      {quote.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link to={`/quotes/${quote.id}`} className="btn btn-sm btn-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending_approval':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'secondary';
  }
}

export default Dashboard;

