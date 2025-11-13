/**
 * Quotes List Component
 * Displays all quotes with filtering and role-based access
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './QuotesList.css';

function QuotesList() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('/quotes');
      setQuotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      await axios.delete(`/quotes/${quoteId}`);
      fetchQuotes(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete quote');
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    if (filter === 'all') return true;
    return quote.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading quotes...</div>;
  }

  return (
    <div className="quotes-list">
      <div className="quotes-header">
        <h1>Quotes</h1>
        <Link to="/quotes/new" className="btn btn-primary">
          Create New Quote
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({quotes.length})
        </button>
        <button
          className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          Draft ({quotes.filter(q => q.status === 'draft').length})
        </button>
        <button
          className={`filter-tab ${filter === 'pending_approval' ? 'active' : ''}`}
          onClick={() => setFilter('pending_approval')}
        >
          Pending ({quotes.filter(q => q.status === 'pending_approval').length})
        </button>
        <button
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({quotes.filter(q => q.status === 'approved').length})
        </button>
      </div>

      {/* Quotes Table */}
      {filteredQuotes.length === 0 ? (
        <div className="no-quotes">
          <p>No quotes found.</p>
          <Link to="/quotes/new" className="btn btn-primary">
            Create Your First Quote
          </Link>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Package</th>
              <th>Trucks</th>
              <th>Hours</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map(quote => (
              <tr key={quote.id}>
                <td>{quote.customerName}</td>
                <td>{quote.packageName}</td>
                <td>{quote.numberOfTrucks}</td>
                <td>{quote.implementationHours.toFixed(1)}</td>
                <td>${quote.total.toFixed(2)}</td>
                <td>
                  <span className={`badge badge-${getStatusColor(quote.status)}`}>
                    {quote.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <Link to={`/quotes/${quote.id}`} className="btn btn-sm btn-primary">
                      View
                    </Link>
                    {quote.status === 'draft' && quote.userId === user.id && (
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default QuotesList;

