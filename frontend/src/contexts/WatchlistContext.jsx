import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiBriefing, setAiBriefing] = useState(null);
  const { user, loading: authLoading } = useAuth();
  
  // Store stock data fetched from backend
  const [stockData, setStockData] = useState({});
  
  const fetchWatchlists = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/watchlists');
      const fetchedWatchlists = response.data;
      setWatchlists(fetchedWatchlists);

      // Fetch stock data for all stocks in watchlists
      console.log("Watchlists fetched. Fetching stock data from backend...");
      
      // Get all unique stock tickers from all watchlists
      const allStocks = fetchedWatchlists.flatMap(wl => wl.stocks || []);
      const uniqueTickers = [...new Set(allStocks.map(stock => stock.ticker))];
      
      // Fetch stock data from backend for each ticker
      const newDataCache = {};
      for (const ticker of uniqueTickers) {
        try {
          const stockResponse = await axios.get(`/api/stocks/${ticker}/data`);
          newDataCache[ticker] = stockResponse.data;
        } catch (error) {
          console.warn(`Failed to fetch data for ${ticker}:`, error);
          // Keep existing data if available, or set to null
          newDataCache[ticker] = stockData[ticker] || null;
        }
      }
      
      setStockData(newDataCache);
      console.log("Stock data cache populated from backend.");

    } catch (error) {
      console.error('Error fetching watchlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWatchlist = async (name, description = '') => {
    try {
      const response = await axios.post('/api/watchlists', {
        name,
        description
      });
      setWatchlists(prev => [...prev, response.data]);
      return { success: true, watchlist: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create watchlist'
      };
    }
  };

  const updateWatchlist = async (id, name, description) => {
    // ... (This function remains unchanged)
    try {
      const response = await axios.put(`/api/watchlists/${id}`, {
        name,
        description
      });
      setWatchlists(prev => 
        prev.map(watchlist => 
          watchlist.id === id ? response.data : watchlist
        )
      );
      return { success: true, watchlist: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update watchlist'
      };
    }
  };

  const deleteWatchlist = async (id) => {
    // ... (This function remains unchanged)
    try {
      await axios.delete(`/api/watchlists/${id}`);
      setWatchlists(prev => prev.filter(watchlist => watchlist.id !== id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete watchlist'
      };
    }
  };

  const addStockToWatchlist = async (watchlistId, ticker, companyName) => {
    try {
      const upperTicker = ticker.toUpperCase();
      const response = await axios.post(`/api/watchlists/${watchlistId}/stocks`, {
        ticker: upperTicker,
        company_name: companyName
      });
      
      // Update the watchlist in state
      setWatchlists(prev => 
        prev.map(watchlist => 
          watchlist.id === watchlistId 
            ? { ...watchlist, stocks: [...(watchlist.stocks || []), response.data] }
            : watchlist
        )
      );

      // Fetch stock data from backend for the newly added stock
      if (!stockData[upperTicker]) {
        console.log(`Fetching stock data for new stock: ${upperTicker}`);
        try {
          const stockResponse = await axios.get(`/api/stocks/${upperTicker}/data`);
          setStockData(prevData => ({
            ...prevData,
            [upperTicker]: stockResponse.data
          }));
        } catch (error) {
          console.warn(`Failed to fetch data for ${upperTicker}:`, error);
        }
      }
      
      return { success: true, stock: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to add stock to watchlist'
      };
    }
  };

  const removeStockFromWatchlist = async (watchlistId, stockId) => {
    // ... (This function remains unchanged, we keep the data in cache)
    try {
      await axios.delete(`/api/watchlists/${watchlistId}/stocks/${stockId}`);
      
      setWatchlists(prev => 
        prev.map(watchlist => 
          watchlist.id === watchlistId 
            ? { 
                ...watchlist, 
                stocks: watchlist.stocks?.filter(stock => stock.id !== stockId) || []
              }
            : watchlist
        )
      );
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to remove stock from watchlist'
      };
    }
  };

  const fetchAiBriefing = async () => {
    // ... (This function remains unchanged)
    try {
      const response = await axios.get('/api/ai-briefing');
      setAiBriefing(response.data);
      return { success: true, briefing: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch AI briefing'
      };
    }
  };

  // Get stock data from backend API
  const getStockData = async (ticker) => {
    try {
      const response = await axios.get(`/api/stocks/${ticker}/data`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || `Failed to fetch data for ${ticker}` 
      };
    }
  };
  
  // Get stock chart data from backend API
  const getStockChart = async (ticker, period = '1M') => {
    try {
      const response = await axios.get(`/api/stocks/${ticker}/chart?period=${period}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || `Failed to fetch chart data for ${ticker}` 
      };
    }
  };

  // Refresh stock data for all tickers (used for real-time updates)
  const refreshStockData = async () => {
    const allStocks = watchlists.flatMap(wl => wl.stocks || []);
    const uniqueTickers = [...new Set(allStocks.map(stock => stock.ticker))];
    
    const newDataCache = {};
    for (const ticker of uniqueTickers) {
      try {
        const stockResponse = await axios.get(`/api/stocks/${ticker}/data`);
        newDataCache[ticker] = stockResponse.data;
      } catch (error) {
        console.warn(`Failed to refresh data for ${ticker}:`, error);
        // Keep existing data if available
        newDataCache[ticker] = stockData[ticker] || null;
      }
    }
    
    setStockData(newDataCache);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchWatchlists();
    }
  }, [authLoading, user]);

  const value = {
    watchlists,
    loading,
    aiBriefing,
    stockData, // Expose the cached stock data
    fetchWatchlists,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    addStockToWatchlist,
    removeStockFromWatchlist,
    fetchAiBriefing,
    getStockData,
    getStockChart,
    refreshStockData
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};