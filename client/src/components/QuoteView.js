/**
 * Quote View Component
 * Displays a single quote with details and actions (view, edit, share, export PDF)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import './QuoteView.css';

function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');

  const fetchQuote = useCallback(async () => {
    try {
      const response = await axios.get(`/quotes/${id}`);
      setQuote(response.data);
      setDiscount(response.data.discount || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quote:', error);
      alert('Failed to load quote');
      navigate('/quotes');
    }
  }, [id, navigate]);

  const fetchManagers = useCallback(async () => {
    try {
      const response = await axios.get('/users');
      const managersList = response.data.filter(u => u.role === 'manager');
      setManagers(managersList);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
    if (user.role === 'general') {
      fetchManagers();
    }
  }, [fetchQuote, fetchManagers, user.role]);

  const handleShare = async () => {
    if (!selectedManager) {
      alert('Please select a manager');
      return;
    }

    setSharing(true);
    try {
      await axios.post(`/quotes/${id}/share`, { managerId: selectedManager });
      alert('Quote shared with manager for approval');
      fetchQuote(); // Refresh quote to show updated status
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to share quote');
    } finally {
      setSharing(false);
    }
  };

  const handleApprove = async (approved) => {
    setApproving(true);
    try {
      await axios.post(`/quotes/${id}/approve`, {
        approved,
        discount: discount
      });
      alert(`Quote ${approved ? 'approved' : 'rejected'} successfully`);
      fetchQuote();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update quote');
    } finally {
      setApproving(false);
    }
  };

  const handleExportPDF = () => {
    if (!quote) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('TMWSuite Quote', 20, 20);
    
    // Customer Information
    doc.setFontSize(14);
    doc.text('Customer Information', 20, 40);
    doc.setFontSize(12);
    doc.text(`Name: ${quote.customerName}`, 20, 50);
    if (quote.customerEmail) {
      doc.text(`Email: ${quote.customerEmail}`, 20, 56);
    }
    
    // Quote Details
    doc.setFontSize(14);
    doc.text('Quote Details', 20, 70);
    doc.setFontSize(12);
    doc.text(`Package: ${quote.packageName}`, 20, 80);
    doc.text(`Number of Trucks: ${quote.numberOfTrucks}`, 20, 86);
    doc.text(`Implementation Hours: ${quote.implementationHours.toFixed(2)} hours`, 20, 92);
    
    // Modules
    if (quote.modules && quote.modules.length > 0) {
      doc.setFontSize(14);
      doc.text('Selected Modules', 20, 105);
      doc.setFontSize(12);
      let yPos = 115;
      quote.modules.forEach((module, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${module.name}`, 20, yPos);
        yPos += 6;
      });
    }
    
    // Pricing
    let pricingY = quote.modules && quote.modules.length > 0 ? 140 + (quote.modules.length * 6) : 105;
    if (pricingY > 270) {
      doc.addPage();
      pricingY = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Pricing', 20, pricingY);
    doc.setFontSize(12);
    doc.text(`Subtotal: $${quote.subtotal.toFixed(2)}`, 20, pricingY + 10);
    if (quote.discount > 0) {
      doc.text(`Discount: $${quote.discount.toFixed(2)}`, 20, pricingY + 16);
    }
    doc.setFontSize(14);
    doc.text(`Total: $${quote.total.toFixed(2)}`, 20, pricingY + 24);
    
    // Status
    doc.setFontSize(12);
    doc.text(`Status: ${quote.status.replace('_', ' ').toUpperCase()}`, 20, pricingY + 32);
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Quote ID: ${quote.id}`, 20, 280);
    doc.text(`Created: ${new Date(quote.createdAt).toLocaleDateString()}`, 20, 286);
    
    // Save PDF
    doc.save(`TMWSuite_Quote_${quote.id}_${quote.customerName.replace(/\s/g, '_')}.pdf`);
  };

  if (loading) {
    return <div className="loading">Loading quote...</div>;
  }

  if (!quote) {
    return <div>Quote not found</div>;
  }

  const canApprove = (user.role === 'admin' || user.role === 'manager') && 
                     quote.status === 'pending_approval';
  const canShare = quote.status === 'draft' && quote.userId === user.id && user.role === 'general';

  return (
    <div className="quote-view">
      <div className="quote-header">
        <h1>Quote #{quote.id}</h1>
        <div className="quote-actions">
          <button onClick={handleExportPDF} className="btn btn-secondary">
            Export PDF
          </button>
          {canShare && (
            <button onClick={() => navigate(`/quotes/${id}/edit`)} className="btn btn-primary">
              Edit Quote
            </button>
          )}
        </div>
      </div>

      <div className="quote-details">
        {/* Customer Information */}
        <div className="detail-section">
          <h2>Customer Information</h2>
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{quote.customerName}</span>
          </div>
          {quote.customerEmail && (
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{quote.customerEmail}</span>
            </div>
          )}
        </div>

        {/* Quote Information */}
        <div className="detail-section">
          <h2>Quote Information</h2>
          <div className="detail-row">
            <span className="detail-label">Package:</span>
            <span className="detail-value">{quote.packageName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Number of Trucks:</span>
            <span className="detail-value">{quote.numberOfTrucks}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Implementation Hours:</span>
            <span className="detail-value">{quote.implementationHours.toFixed(2)} hours</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`badge badge-${getStatusColor(quote.status)}`}>
              {quote.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Modules */}
        {quote.modules && quote.modules.length > 0 && (
          <div className="detail-section">
            <h2>Selected Modules</h2>
            <ul className="modules-list">
              {quote.modules.map(module => (
                <li key={module.id}>
                  <strong>{module.name}</strong>
                  {module.description && <span> - {module.description}</span>}
                  {module.price > 0 && <span className="module-price"> (${module.price.toFixed(2)})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing */}
        <div className="detail-section">
          <h2>Pricing</h2>
          <div className="pricing-summary">
            <div className="pricing-row">
              <span>Subtotal:</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="pricing-row">
                <span>Discount:</span>
                <span>-${quote.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="pricing-row total">
              <span>Total:</span>
              <span>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="detail-section">
            <h2>Notes</h2>
            <p>{quote.notes}</p>
          </div>
        )}

        {/* Share with Manager (General Users) */}
        {canShare && (
          <div className="detail-section">
            <h2>Share for Approval</h2>
            <div className="form-group">
              <label htmlFor="manager">Select Manager</label>
              <select
                id="manager"
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
              >
                <option value="">-- Select Manager --</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleShare}
              disabled={sharing || !selectedManager}
              className="btn btn-primary"
            >
              {sharing ? 'Sharing...' : 'Share for Approval'}
            </button>
          </div>
        )}

        {/* Approve/Reject (Managers/Admins) */}
        {canApprove && (
          <div className="detail-section">
            <h2>Approve Quote</h2>
            <div className="form-group">
              <label htmlFor="discount">Discount Amount ($)</label>
              <input
                type="number"
                id="discount"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.01"
              />
            </div>
            <div className="approval-actions">
              <button
                onClick={() => handleApprove(true)}
                disabled={approving}
                className="btn btn-success"
              >
                {approving ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleApprove(false)}
                disabled={approving}
                className="btn btn-danger"
              >
                {approving ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </div>
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

export default QuoteView;

