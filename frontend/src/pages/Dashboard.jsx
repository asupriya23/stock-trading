import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Trash2, 
  Edit3,
  Brain,
  RefreshCw,
  Loader2
} from 'lucide-react';
import CreateWatchlistModal from '../components/CreateWatchlistModal';
import AIBriefing from '../components/AIBriefing';
import KPIStat from '../components/KPIStat';

const Dashboard = () => {
  const { 
    watchlists, 
    loading, 
    aiBriefing, 
    stockData,
    fetchAiBriefing, 
    deleteWatchlist 
  } = useWatchlist();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (watchlists.length > 0 && !aiBriefing) {
      fetchAiBriefing();
    }
  }, [watchlists, aiBriefing, fetchAiBriefing]);

  const handleDeleteWatchlist = async (id) => {
    setDeletingId(id);
    const result = await deleteWatchlist(id);
    setDeletingId(null);
    
    if (!result.success) {
      alert(result.error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatChange = (change, changePercent) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        {formatPrice(Math.abs(change))} ({Math.abs(changePercent).toFixed(2)}%)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="market-noise" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-white/70 mt-2">
          Manage your stock watchlists and get AI-powered market insights.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi mb-8">
        <KPIStat label="Total Watchlists" value={watchlists.length} />
        <KPIStat label="Total Stocks" value={watchlists.reduce((a,w)=>a+(w.stocks?.length||0),0)} />
        <KPIStat label="Market Sentiment" value="Bullish" delta="+0.8%" positive />
        <KPIStat label="Volatility" value="Moderate" delta="1.2" positive={false} />
      </div>

      {/* AI Briefing */}
      {aiBriefing && (
        <div className="mb-8">
          <AIBriefing briefing={aiBriefing} />
        </div>
      )}

      {/* Watchlists Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Watchlists</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors glow"
          >
            <Plus className="h-5 w-5" />
            <span>New Watchlist</span>
          </button>
        </div>

        {watchlists.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">No watchlists yet</h3>
            <p className="mt-2 text-white/70">
              Create your first watchlist to start tracking stocks and get AI insights.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors glow"
            >
              Create Watchlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlists.map((watchlist) => (
              <div key={watchlist.id} className="watchlist-card glass-card rounded-xl border border-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{watchlist.name}</h3>
                    {watchlist.description && (
                      <p className="text-sm text-white/70 mt-1">{watchlist.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDeleteWatchlist(watchlist.id)}
                      disabled={deletingId === watchlist.id}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {deletingId === watchlist.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>{watchlist.stocks?.length || 0} stocks</span>
                    <span>Created {new Date(watchlist.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Sample stocks display */}
                {watchlist.stocks && watchlist.stocks.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {watchlist.stocks.slice(0, 3).map((stock) => (
                      <div key={stock.id} className="flex items-center justify-between text-sm text-white/80">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{stock.ticker}</span>
                          <span className="text-white/60">{stock.company_name}</span>
                        </div>
                        <div className="text-white/60">
                          {/* Use real stock data from backend */}
                          {stockData[stock.ticker] ? 
                            formatPrice(stockData[stock.ticker].current_price) : 
                            'Loading...'
                          }
                        </div>
                      </div>
                    ))}
                    {watchlist.stocks.length > 3 && (
                      <div className="text-sm text-white/60">
                        +{watchlist.stocks.length - 3} more stocks
                      </div>
                    )}
                  </div>
                )}

                <Link
                  to={`/watchlist/${watchlist.id}`}
                  className="flex items-center justify-center space-x-2 w-full bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <CreateWatchlistModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
