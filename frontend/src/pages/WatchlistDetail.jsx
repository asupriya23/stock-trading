import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext'; // Keep using the hook
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Loader2,
  Search
} from 'lucide-react';
import AddStockModal from '../components/AddStockModal';
// Remove Sparkline for now if it depends on old data structure, or adapt it later
// import Sparkline from '../components/Sparkline'; 

const WatchlistDetail = () => {
  const { id } = useParams();
  const { 
    watchlists, 
    // 1. GET THE GLOBAL stockData CACHE FROM CONTEXT
    stockData: globalStockData, 
    removeStockFromWatchlist,
    refreshStockData
  } = useWatchlist(); 
  
  const [watchlist, setWatchlist] = useState(null);
  // 2. REMOVE LOCAL stockData STATE - we'll use globalStockData directly
  // const [stockData, setStockData] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    // This part is correct - find the specific watchlist
    const foundWatchlist = watchlists.find(w => w.id === parseInt(id));
    setWatchlist(foundWatchlist);
    // Only set loading to false *after* finding the watchlist
    setLoading(false); 
  }, [watchlists, id]);

  // Real-time polling: refresh stock data every 3 seconds
  useEffect(() => {
    if (!watchlist || !watchlist.stocks || watchlist.stocks.length === 0) return;

    const interval = setInterval(() => {
      refreshStockData();
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [watchlist, refreshStockData]);

  // 3. REMOVE useEffect THAT FETCHED DATA LOCALLY - Context already handles it
  // useEffect(() => {
  //   if (watchlist?.stocks) {
  //     fetchStockData();
  //   }
  // }, [watchlist]);

  // 4. REMOVE local fetchStockData function
  // const fetchStockData = async () => { ... };

  const handleRemoveStock = async (stockId) => {
    setRemovingId(stockId);
    // Ensure watchlist.id is passed correctly
    const result = await removeStockFromWatchlist(parseInt(id), stockId); 
    setRemovingId(null);
    
    if (!result.success) {
      alert(result.error);
    }
    // Note: The context should ideally update the 'watchlists' state,
    // which will trigger the useEffect above to update this component's 'watchlist' state.
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatChange = (stockData) => {
    if (!stockData || typeof stockData.change !== 'number' || typeof stockData.change_percent !== 'number') {
      return <span className="text-white/70">N/A</span>;
    }
    
    const isPositive = stockData.change >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        {formatPrice(Math.abs(stockData.change))} ({Math.abs(stockData.change_percent).toFixed(2)}%)
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

  if (!watchlist) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Watchlist not found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="market-noise" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{watchlist.name}</h1>
            {watchlist.description && (
              <p className="text-white/70 mt-2">{watchlist.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors glow"
          >
            <Plus className="h-5 w-5" />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Stocks List */}
      <div className="glass-card rounded-xl border border-white/10">
        {/* 6. LOOP OVER watchlist.stocks (This part was correct) */}
        {watchlist.stocks && watchlist.stocks.length > 0 ? (
          <div className="divide-y divide-white/10"> {/* Use white/10 for divider */}
            {watchlist.stocks.map((stock) => {
              // 7. GET DATA DIRECTLY FROM GLOBAL CONTEXT CACHE
              const data = globalStockData[stock.ticker]; 
              
              return (
                <div key={stock.id} className="p-4 sm:p-6 hover:bg-white/5 transition-colors"> {/* Adjusted padding */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    {/* Stock Info (Left Side) */}
                    <div className="flex-1 mb-4 sm:mb-0">
                      <div className="flex items-center space-x-4">
                        {/* Ticker and Name */}
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {stock.ticker}
                          </h3>
                          {/* Display company name if available */}
                          {stock.company_name && ( 
                            <p className="text-sm text-white/60">{stock.company_name}</p>
                          )}
                        </div>
                        
                        {/* Price and Change (Middle) */}
                        {data ? ( // Check if data exists in the global cache
                          <div className="flex items-center space-x-4 sm:space-x-6">
                            <div className="text-right">
                              {/* Use backend API data fields */}
                              <div className="text-lg font-semibold text-white">
                                {formatPrice(data.current_price)} {/* Use current_price from backend */}
                              </div>
                              <div className="text-sm mt-1"> 
                                {formatChange(data)} {/* Pass the whole data object */}
                              </div>
                            </div>
                            {/* Optional: Add Sparkline back if adapted */}
                            {/* <div className="hidden md:block w-24 h-10"> */}
                              {/* <Sparkline data={...} /> You'll need the full array here */}
                            {/* </div> */}
                          </div>
                        ) : (
                          <div className="text-white/60 text-sm">Loading data...</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions (Right Side) */}
                    <div className="flex items-center space-x-2 sm:space-x-4 self-start sm:self-center">
                      <Link
                        to={`/stock/${stock.ticker}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-white/10" // Style tweaks
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleRemoveStock(stock.id)}
                        disabled={removingId === stock.id}
                        className="text-red-500 hover:text-red-400 disabled:opacity-50 px-2 py-1 rounded hover:bg-white/10" // Style tweaks
                        aria-label={`Remove ${stock.ticker}`}
                      >
                        {removingId === stock.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // "No Stocks" message remains the same
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-white/40" />
            <h3 className="mt-4 text-lg font-medium text-white">No stocks in this watchlist</h3>
            <p className="mt-2 text-white/70">
              Add stocks to start tracking their performance.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors glow"
            >
              Add Your First Stock
            </button>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <AddStockModal
          watchlistId={parseInt(id)} // Ensure ID is a number
          onClose={() => setShowAddModal(false)}
          // Pass a function to refresh data if AddStockModal doesn't use context directly
          // onStockAdded={() => { /* maybe call fetchWatchlists from context here? */ }}
        />
      )}
    </div>
  );
};

export default WatchlistDetail;