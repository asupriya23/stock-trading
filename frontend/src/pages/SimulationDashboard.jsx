import React, { useState } from 'react';
import { usePaperTrading } from '../contexts/PaperTradingContext';
import PortfolioSummary from '../components/PortfolioSummary';
import TradeHistory from '../components/TradeHistory';
import SimulationForm from '../components/SimulationForm';

const SimulationDashboard = () => {
  const { resetAccount } = usePaperTrading();
  const [selectedStock, setSelectedStock] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetAccount = async () => {
    setResetLoading(true);
    try {
      const result = await resetAccount();
      if (result.success) {
        alert('Account reset successfully! You now have $100,000 virtual cash.');
        setShowResetConfirm(false);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  const handleOrderExecuted = (result) => {
    // Could add a toast notification here
    console.log('Order executed:', result);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paper Trading</h1>
              <p className="text-gray-600 mt-1">
                Practice trading with virtual money - no real money at risk
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Reset Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portfolio and Trade History */}
          <div className="lg:col-span-2 space-y-8">
            <PortfolioSummary />
            <TradeHistory />
          </div>

          {/* Right Column - Trading Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Stock to Trade
                </label>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a stock...</option>
                  <option value="AAPL">AAPL - Apple Inc.</option>
                  <option value="GOOGL">GOOGL - Alphabet Inc.</option>
                  <option value="MSFT">MSFT - Microsoft Corporation</option>
                  <option value="AMZN">AMZN - Amazon.com Inc.</option>
                  <option value="TSLA">TSLA - Tesla Inc.</option>
                  <option value="META">META - Meta Platforms Inc.</option>
                  <option value="NVDA">NVDA - NVIDIA Corporation</option>
                  <option value="NFLX">NFLX - Netflix Inc.</option>
                  <option value="AMD">AMD - Advanced Micro Devices Inc.</option>
                  <option value="INTC">INTC - Intel Corporation</option>
                </select>
              </div>

              {selectedStock && (
                <SimulationForm
                  stockTicker={selectedStock}
                  onOrderExecuted={handleOrderExecuted}
                />
              )}

              {!selectedStock && (
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Ready to Trade?
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Select a stock from the dropdown above to start placing orders
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Reset Paper Account
            </h3>
            <p className="text-gray-600 mb-6">
              This will delete all your positions and trades, and reset your cash balance to $100,000. 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAccount}
                disabled={resetLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:bg-gray-400"
              >
                {resetLoading ? 'Resetting...' : 'Reset Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationDashboard;
