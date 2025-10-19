import React, { useState } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { X, Loader2, Search } from 'lucide-react';

const AddStockModal = ({ watchlistId, onClose }) => {
  const [formData, setFormData] = useState({
    ticker: '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addStockToWatchlist } = useWatchlist();

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

    if (!formData.ticker.trim()) {
      setError('Stock ticker is required');
      setLoading(false);
      return;
    }

    const result = await addStockToWatchlist(
      watchlistId,
      formData.ticker.trim().toUpperCase(),
      formData.companyName.trim() || formData.ticker.trim().toUpperCase()
    );
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl max-w-md w-full border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Add Stock to Watchlist</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-white/80">
                Stock Ticker *
              </label>
              <input
                id="ticker"
                name="ticker"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                placeholder="e.g., AAPL, GOOGL, MSFT"
                value={formData.ticker}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-white/60">
                Enter the stock symbol (ticker) for the company you want to track.
              </p>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-white/80">
                Company Name (Optional)
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                placeholder="e.g., Apple Inc."
                value={formData.companyName}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-white/60">
                If left empty, the ticker will be used as the company name.
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed glow"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Add Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;
