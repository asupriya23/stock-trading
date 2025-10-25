import React from 'react';
import { usePaperTrading } from '../contexts/PaperTradingContext';

const PortfolioSummary = () => {
  const { portfolio, loading } = usePaperTrading();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Portfolio Summary</h3>
        <p className="text-gray-500">No portfolio data available</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    // Default to 0 if amount is not a number
    const numberAmount = typeof amount === 'number' ? amount : 0; 
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numberAmount);
  };

  const formatPercent = (percent) => {
    // Check if 'percent' is not a valid number
    if (typeof percent !== 'number' || isNaN(percent)) {
      return '+0.00%'; // Or you could return 'N/A'
    }
    // Now it's safe to use .toFixed()
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Portfolio Summary</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-gray-800">
            {formatCurrency(portfolio.total_value)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Cash Balance</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(portfolio.cash_balance)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Positions Value</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(portfolio.positions_value)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${
            portfolio.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(portfolio.total_pnl)}
          </div>
          <div className={`text-sm ${
            portfolio.total_pnl_percent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(portfolio.total_pnl_percent)}
          </div>
        </div>
      </div>

      {/* Positions */}
      {portfolio.positions && portfolio.positions.length > 0 ? (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Current Positions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Symbol</th>
                  <th className="text-left py-2 font-medium text-gray-600">Quantity</th>
                  <th className="text-left py-2 font-medium text-gray-600">Avg Price</th>
                  <th className="text-left py-2 font-medium text-gray-600">Current Price</th>
                  <th className="text-left py-2 font-medium text-gray-600">Value</th>
                  <th className="text-left py-2 font-medium text-gray-600">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((position) => (
                  <tr key={position.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-800">
                      {position.stock_ticker}
                    </td>
                    <td className="py-3 text-gray-600">
                      {position.quantity}
                    </td>
                    <td className="py-3 text-gray-600">
                      {formatCurrency(position.average_buy_price)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {formatCurrency(position.current_price)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {formatCurrency(position.position_value)}
                    </td>
                    <td className="py-3">
                      <div className={`font-medium ${
                        position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(position.pnl)}
                      </div>
                      <div className={`text-xs ${
                        position.pnl_percent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(position.pnl_percent)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">No positions yet</p>
          <p className="text-sm text-gray-400">Start trading to see your positions here</p>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;
