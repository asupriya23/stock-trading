import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PaperTradingContext = createContext();

export const usePaperTrading = () => {
  const context = useContext(PaperTradingContext);
  if (!context) {
    throw new Error('usePaperTrading must be used within a PaperTradingProvider');
  }
  return context;
};

export const PaperTradingProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  // const [isPaperMode, setIsPaperMode] = useState(false); // REMOVED
  const { user, loading: authLoading } = useAuth();

  // Fetch portfolio summary
  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/paper/portfolio');
      setPortfolio(response.data);
      return { success: true, portfolio: response.data };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch portfolio'
      };
    } finally {
      setLoading(false);
    }
  };

  // Fetch trade history
  const fetchTrades = async (limit = 50) => {
    try {
      const response = await axios.get(`/api/v1/paper/trades?limit=${limit}`);
      setTrades(response.data.trades);
      return { success: true, trades: response.data.trades };
    } catch (error) {
      console.error('Error fetching trades:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch trades'
      };
    }
  };

  // Execute buy order
  const executeBuyOrder = async (stockTicker, quantity, orderType = 'market', limitPrice = null) => {
    try {
      const orderData = {
        stock_ticker: stockTicker,
        quantity: quantity,
        order_type: orderType,
        limit_price: limitPrice
      };

      const response = await axios.post('/api/v1/paper/buy', orderData);
      
      // Refresh portfolio after successful trade
      if (response.data.success) {
        await fetchPortfolio();
        await fetchTrades();
      }
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to execute buy order'
      };
    }
  };

  // Execute sell order
  const executeSellOrder = async (stockTicker, quantity, orderType = 'market', limitPrice = null) => {
    try {
      const orderData = {
        stock_ticker: stockTicker,
        quantity: quantity,
        order_type: orderType,
        limit_price: limitPrice
      };

      const response = await axios.post('/api/v1/paper/sell', orderData);
      
      // Refresh portfolio after successful trade
      if (response.data.success) {
        await fetchPortfolio();
        await fetchTrades();
      }
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to execute sell order'
      };
    }
  };

  // Reset paper account
  const resetAccount = async () => {
    try {
      const response = await axios.post('/api/v1/paper/reset');
      
      if (response.data.success) {
        await fetchPortfolio();
        await fetchTrades();
      }
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to reset account'
      };
    }
  };

  // Toggle paper trading mode
  // const togglePaperMode = () => { // REMOVED
  //   setIsPaperMode(!isPaperMode);
  // };

  // Get current stock price for a ticker
  const getCurrentPrice = async (ticker) => {
    try {
      const response = await axios.get(`/api/stocks/${ticker}/data`);
      return {
        success: true,
        price: response.data.current_price
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || `Failed to get price for ${ticker}`
      };
    }
  };

  // Calculate position P&L
  const calculatePositionPnL = (position, currentPrice) => {
    const positionValue = position.quantity * currentPrice;
    const costBasis = position.quantity * position.average_buy_price;
    const pnl = positionValue - costBasis;
    const pnlPercent = (pnl / costBasis) * 100;
    
    return {
      positionValue: round(positionValue, 2),
      pnl: round(pnl, 2),
      pnlPercent: round(pnlPercent, 2)
    };
  };

  // Helper function to round numbers
  const round = (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Auto-refresh portfolio data every 30 seconds
  useEffect(() => {
    // UPDATED: Now only depends on the user
    if (!user) return; 

    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]); // UPDATED: Dependency array changed

  // Fetch initial data when user logs in
  useEffect(() => {
    // UPDATED: Now only depends on user and authLoading
    if (!authLoading && user) { 
      fetchPortfolio();
      fetchTrades();
    }
  }, [authLoading, user]); // UPDATED: Dependency array changed

  const value = {
    portfolio,
    trades,
    loading,
    // isPaperMode, // REMOVED
    fetchPortfolio,
    fetchTrades,
    executeBuyOrder,
    executeSellOrder,
    resetAccount,
    // togglePaperMode, // REMOVED
    getCurrentPrice,
    calculatePositionPnL
  };

  return (
    <PaperTradingContext.Provider value={value}>
      {children}
    </PaperTradingContext.Provider>
  );
};