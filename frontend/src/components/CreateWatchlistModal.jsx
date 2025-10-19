import React, { useState } from 'react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { X, Loader2 } from 'lucide-react';

const CreateWatchlistModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { createWatchlist } = useWatchlist();

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

    if (!formData.name.trim()) {
      setError('Watchlist name is required');
      setLoading(false);
      return;
    }

    const result = await createWatchlist(formData.name.trim(), formData.description.trim());
    
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
          <h3 className="text-lg font-semibold text-white">Create New Watchlist</h3>
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
              <label htmlFor="name" className="block text-sm font-medium text-white/80">
                Watchlist Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                placeholder="e.g., Tech Giants, EV Stocks"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/80">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-white/40"
                placeholder="Describe what stocks you want to track in this watchlist"
                value={formData.description}
                onChange={handleChange}
              />
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
                'Create Watchlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWatchlistModal;
