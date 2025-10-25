import React from 'react';
import { usePaperTrading } from '../contexts/PaperTradingContext';

const TradeHistory = () => {
  const { trades, loading } = usePaperTrading();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Trade History</h3>
      
      {trades && trades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">Date</th>
                <th className="text-left py-2 font-medium text-gray-600">Symbol</th>
                <th className="text-left py-2 font-medium text-gray-600">Type</th>
                <th className="text-left py-2 font-medium text-gray-600">Quantity</th>
                <th className="text-left py-2 font-medium text-gray-600">Price</th>
                <th className="text-left py-2 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-100">
                  <td className="py-3 text-gray-600">
                    {formatDateTime(trade.created_at)}
                  </td>
                  <td className="py-3 font-medium text-gray-800">
                    {trade.stock_ticker}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.trade_type === 'buy'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.trade_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">
                    {trade.quantity}
                  </td>
                  <td className="py-3 text-gray-600">
                    {formatCurrency(trade.price)}
                  </td>
                  <td className="py-3 font-medium text-gray-800">
                    {formatCurrency(trade.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-gray-500">No trades yet</p>
          <p className="text-sm text-gray-400">Your trading history will appear here</p>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
