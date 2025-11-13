/**
 * Quote Builder Component
 * Allows users to create new quotes by selecting packages, modules, and entering truck count
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuoteBuilder.css';

function QuoteBuilder() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [numberOfTrucks, setNumberOfTrucks] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [implementationHours, setImplementationHours] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (selectedPackage) {
      calculateQuote();
    }
  }, [selectedPackage, selectedModules, numberOfTrucks]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get('/packages');
      setPackages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load packages');
      setLoading(false);
    }
  };

  const calculateQuote = async () => {
    if (!selectedPackage) return;

    try {
      // Calculate subtotal
      const packagePrice = selectedPackage.basePrice || 0;
      const modulePrices = selectedModules.reduce((sum, module) => {
        return sum + (module.basePrice || 0);
      }, 0);
      const newSubtotal = packagePrice + modulePrices;
      setSubtotal(newSubtotal);

      // Calculate implementation hours
      const moduleIds = selectedModules.map(m => m.id);
      const hoursResponse = await axios.post('/calculations/implementation-hours', {
        packageId: selectedPackage.id,
        moduleIds,
        numberOfTrucks
      });

      setImplementationHours(hoursResponse.data.totalHours);
    } catch (error) {
      console.error('Error calculating quote:', error);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    // Reset module selection when package changes
    setSelectedModules([]);
  };

  const handleModuleToggle = (module) => {
    setSelectedModules(prev => {
      const isSelected = prev.some(m => m.id === module.id);
      if (isSelected) {
        return prev.filter(m => m.id !== module.id);
      } else {
        return [...prev, module];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!selectedPackage) {
      setError('Please select a package');
      setSaving(false);
      return;
    }

    if (!customerName) {
      setError('Customer name is required');
      setSaving(false);
      return;
    }

    try {
      const moduleIds = selectedModules.map(m => m.id);
      const response = await axios.post('/quotes', {
        customerName,
        customerEmail,
        packageId: selectedPackage.id,
        numberOfTrucks,
        moduleIds,
        notes
      });

      navigate(`/quotes/${response.data.quoteId}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create quote');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading packages...</div>;
  }

  const total = subtotal;

  return (
    <div className="quote-builder">
      <h1>Create New Quote</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Customer Information */}
        <div className="quote-section">
          <h2>Customer Information</h2>
          <div className="form-group">
            <label htmlFor="customerName">Customer Name *</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Enter customer name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="customerEmail">Customer Email</label>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter customer email"
            />
          </div>
        </div>

        {/* Package Selection */}
        <div className="quote-section">
          <h2>Select Package</h2>
          <div className="package-grid">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={`package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
                onClick={() => handlePackageSelect(pkg)}
              >
                <h3>{pkg.name}</h3>
                <p>{pkg.description || 'No description available'}</p>
                {pkg.basePrice > 0 && (
                  <div className="package-price">Base: ${pkg.basePrice.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Module Selection */}
        {selectedPackage && (
          <div className="quote-section">
            <h2>Select Modules</h2>
            {selectedPackage.modules && selectedPackage.modules.length > 0 ? (
              <div className="modules-list">
                {selectedPackage.modules.map(module => (
                  <div key={module.id} className="module-item">
                    <input
                      type="checkbox"
                      id={`module-${module.id}`}
                      checked={selectedModules.some(m => m.id === module.id)}
                      onChange={() => handleModuleToggle(module)}
                    />
                    <label htmlFor={`module-${module.id}`}>
                      <strong>{module.name}</strong>
                      {module.description && <span> - {module.description}</span>}
                      {module.basePrice > 0 && (
                        <span className="module-price"> (${module.basePrice.toFixed(2)})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p>No modules available for this package.</p>
            )}
          </div>
        )}

        {/* Truck Count */}
        <div className="quote-section">
          <h2>Fleet Information</h2>
          <div className="form-group">
            <label htmlFor="numberOfTrucks">Number of Trucks *</label>
            <input
              type="number"
              id="numberOfTrucks"
              value={numberOfTrucks}
              onChange={(e) => setNumberOfTrucks(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div className="quote-section">
          <h2>Additional Notes</h2>
          <div className="form-group">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              placeholder="Add any additional notes or special requirements..."
            />
          </div>
        </div>

        {/* Quote Summary */}
        {selectedPackage && (
          <div className="quote-summary">
            <h3>Quote Summary</h3>
            <div className="summary-row">
              <span>Package:</span>
              <span>{selectedPackage.name}</span>
            </div>
            <div className="summary-row">
              <span>Number of Trucks:</span>
              <span>{numberOfTrucks}</span>
            </div>
            <div className="summary-row">
              <span>Selected Modules:</span>
              <span>{selectedModules.length}</span>
            </div>
            <div className="summary-row">
              <span>Implementation Hours:</span>
              <span>{implementationHours.toFixed(2)} hours</span>
            </div>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/quotes')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !selectedPackage}>
            {saving ? 'Creating Quote...' : 'Create Quote'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuoteBuilder;

