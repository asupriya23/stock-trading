import React, { useState, useEffect } from 'react';
import { usePaperTrading } from '../contexts/PaperTradingContext';

const PaperTradingForm = ({ stockTicker, onOrderExecuted }) => {
  const { executeBuyOrder, executeSellOrder, getCurrentPrice, portfolio } = usePaperTrading();
  const [orderType, setOrderType] = useState('buy');
  const [quantity, setQuantity] = useState(1);
  const [orderMethod, setOrderMethod] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get current position for this stock
  const currentPosition = portfolio?.positions?.find(p => p.stock_ticker === stockTicker);

  useEffect(() => {
    if (stockTicker) {
      fetchCurrentPrice();
    }
  }, [stockTicker]);

  const fetchCurrentPrice = async () => {
    const result = await getCurrentPrice(stockTicker);
    if (result.success) {
      setCurrentPrice(result.price);
      setLimitPrice(result.price.toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let result;
      const limitPriceValue = orderMethod === 'limit' ? parseFloat(limitPrice) : null;

      if (orderType === 'buy') {
        result = await executeBuyOrder(stockTicker, quantity, orderMethod, limitPriceValue);
      } else {
        result = await executeSellOrder(stockTicker, quantity, orderMethod, limitPriceValue);
      }

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setQuantity(1);
        if (onOrderExecuted) {
          onOrderExecuted(result);
        }
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const maxQuantity = orderType === 'sell' && currentPosition 
    ? currentPosition.quantity 
    : Math.floor(portfolio?.cash_balance / currentPrice) || 0;

  const totalCost = quantity * (orderMethod === 'limit' ? parseFloat(limitPrice) : currentPrice);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Paper Trade: {stockTicker}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="buy"
                checked={orderType === 'buy'}
                onChange={(e) => setOrderType(e.target.value)}
                className="mr-2"
              />
              <span className="text-green-600 font-medium">Buy</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sell"
                checked={orderType === 'sell'}
                onChange={(e) => setOrderType(e.target.value)}
                className="mr-2"
                disabled={!currentPosition}
              />
              <span className="text-red-600 font-medium">Sell</span>
            </label>
          </div>
          {orderType === 'sell' && !currentPosition && (
            <p className="text-sm text-gray-500 mt-1">
              You don't have any shares of {stockTicker} to sell
            </p>
          )}
        </div>

        {/* Order Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Method
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="market"
                checked={orderMethod === 'market'}
                onChange={(e) => setOrderMethod(e.target.value)}
                className="mr-2"
              />
              Market Order
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="limit"
                checked={orderMethod === 'limit'}
                onChange={(e) => setOrderMethod(e.target.value)}
                className="mr-2"
              />
              Limit Order
            </label>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="text-sm text-gray-500">
              Max: {maxQuantity}
            </span>
          </div>
        </div>

        {/* Limit Price */}
        {orderMethod === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limit Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Current price: ${currentPrice.toFixed(2)}
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Shares:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Price per share:</span>
              <span>${orderMethod === 'limit' ? parseFloat(limitPrice).toFixed(2) : currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total {orderType === 'buy' ? 'Cost' : 'Proceeds'}:</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
            {orderType === 'buy' && (
              <div className="flex justify-between text-sm">
                <span>Remaining Cash:</span>
                <span>${(portfolio?.cash_balance - totalCost).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (orderType === 'sell' && !currentPosition) || quantity > maxQuantity}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            orderType === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {loading ? 'Executing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${quantity} Shares`}
        </button>
      </form>
    </div>
  );
};

export default PaperTradingForm;
