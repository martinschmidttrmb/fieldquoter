/**
 * Users List Component
 * Admin-only component to view and manage users, including impersonation feature
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './UsersList.css';

function UsersList() {
  const { user, impersonate } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impersonatingUserId, setImpersonatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleImpersonate = async (userId) => {
    if (!window.confirm('Are you sure you want to impersonate this user? You will be logged in as them.')) {
      return;
    }

    setImpersonatingUserId(userId);
    const result = await impersonate(userId);

    if (result.success) {
      // Redirect to dashboard after successful impersonation
      window.location.href = '/dashboard';
    } else {
      alert(result.error || 'Failed to impersonate user');
      setImpersonatingUserId(null);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge-danger';
      case 'manager':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="users-list">
      <div className="users-header">
        <h1>User Management</h1>
        <p className="admin-note">As an admin, you can view all users and impersonate them to see their view.</p>
      </div>

      {users.length === 0 ? (
        <div className="no-users">
          <p>No users found.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => (
              <tr key={userItem.id}>
                <td>{userItem.firstName} {userItem.lastName}</td>
                <td>{userItem.email}</td>
                <td>
                  <span className={`badge ${getRoleBadgeClass(userItem.role)}`}>
                    {userItem.role}
                  </span>
                </td>
                <td>{userItem.managerName || 'N/A'}</td>
                <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                <td>
                  {userItem.id !== user.id && (
                    <button
                      onClick={() => handleImpersonate(userItem.id)}
                      disabled={impersonatingUserId === userItem.id}
                      className="btn btn-sm btn-primary"
                    >
                      {impersonatingUserId === userItem.id ? 'Impersonating...' : 'Impersonate'}
                    </button>
                  )}
                  {userItem.id === user.id && (
                    <span className="current-user-badge">Current User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersList;

