import React, { useState } from 'react';
import { X, Loader2, Bell, TrendingUp, TrendingDown } from 'lucide-react';

const PriceAlertModal = ({ ticker, currentPrice, onClose }) => {
  const [formData, setFormData] = useState({
    highPrice: '',
    lowPrice: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.highPrice && !formData.lowPrice) {
      setError('Please set at least one price alert (high or low)');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required for notifications');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validate price values
    const highPrice = parseFloat(formData.highPrice);
    const lowPrice = parseFloat(formData.lowPrice);
    const current = parseFloat(currentPrice);

    if (formData.highPrice && (isNaN(highPrice) || highPrice <= 0)) {
      setError('High price must be a positive number');
      setLoading(false);
      return;
    }

    if (formData.lowPrice && (isNaN(lowPrice) || lowPrice <= 0)) {
      setError('Low price must be a positive number');
      setLoading(false);
      return;
    }

    if (formData.highPrice && formData.lowPrice && highPrice <= lowPrice) {
      setError('High price must be greater than low price');
      setLoading(false);
      return;
    }

    try {
      // Call API to create price alert
      const alertData = {
        stock_ticker: ticker,
        high_price: formData.highPrice ? highPrice : null,
        low_price: formData.lowPrice ? lowPrice : null,
        email: formData.email.trim()
      };

      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(alertData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create price alert');
      }

      const result = await response.json();
      console.log('Price alert created:', result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create price alert. Please try again.');
    }
    
    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-white/10 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Set Price Alert</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-sm text-blue-300 mb-1">Current Price</div>
            <div className="text-lg font-semibold text-white">{formatPrice(currentPrice)}</div>
            <div className="text-xs text-white/60 mt-1">{ticker}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="highPrice" className="block text-sm font-medium text-white/80 mb-2">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span>High Alert</span>
                  </div>
                </label>
                <input
                  id="highPrice"
                  name="highPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                  placeholder="e.g., 150.00"
                  value={formData.highPrice}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-white/60">
                  Alert when price goes above this value
                </p>
              </div>

              <div>
                <label htmlFor="lowPrice" className="block text-sm font-medium text-white/80 mb-2">
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span>Low Alert</span>
                  </div>
                </label>
                <input
                  id="lowPrice"
                  name="lowPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                  placeholder="e.g., 120.00"
                  value={formData.lowPrice}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-white/60">
                  Alert when price goes below this value
                </p>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-300">
                💡 <strong>Tip:</strong> You can set either high or low alert, or both. 
                You'll receive email notifications when the price crosses your thresholds.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-500/10 p-4 border border-red-500/20">
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/80 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  <span>Set Alert</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceAlertModal;
