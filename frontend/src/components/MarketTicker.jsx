import React, { useEffect, useState } from 'react';
// 1. Import the hook
import { useWatchlist } from '../contexts/WatchlistContext'; 

const defaultTickers = [
  // { symbol: 'AAPL' },
  // { symbol: 'MSFT' },
  // { symbol: 'NVDA' },
  // { symbol: 'AMZN' },
  // { symbol: 'GOOGL' },
  // { symbol: 'TSLA' },
  // { symbol: 'META' },
  // { symbol: 'AMD' },
  // { symbol: 'NFLX' },
  // { symbol: 'INTC' },
];

const MarketTicker = () => {
  const [quotes, setQuotes] = useState([]);
  // 2. Get the function from the context
  const { getStockData } = useWatchlist(); 

  useEffect(() => {
    const fetchQuotes = async () => {
      // 3. Use getStockData instead of axios
      const results = await Promise.all(
        defaultTickers.map(async (t) => {
          const result = await getStockData(t.symbol);
          // Return the data if successful, otherwise null
          return result.success ? result.data : null; 
        })
      );
      // Filter out any null results (if data wasn't found)
      setQuotes(results.filter(q => q !== null)); 
    };
    
    fetchQuotes();
    // Refresh every minute (adjust timing if needed)
    const id = setInterval(fetchQuotes, 60_000); 
    return () => clearInterval(id);
    
    // 4. Add getStockData as a dependency
  }, [getStockData]); 

  if (!quotes.length) return null;

  // Helper to calculate change for synthetic data
  const calculateChange = (quote) => {
    if (!quote || typeof quote.close !== 'number' || typeof quote.open !== 'number') {
      return { change: 0, changePercent: 0 };
    }
    const change = quote.close - quote.open;
    const changePercent = quote.open === 0 ? 0 : (change / quote.open) * 100;
    return { change, changePercent };
  };

  return (
    <div className="ticker-track">
      {/* Duplicate content for seamless scrolling animation */}
      <div className="ticker-content">
        {[...quotes, ...quotes].map((q, idx) => {
          // 5. Calculate change based on synthetic data structure
          const { change, changePercent } = calculateChange(q);
          const isUp = change >= 0;
          
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {/* Add ticker symbol from the quote data if available, or fallback */}
              <span className="chip font-medium">{q.ticker || defaultTickers.find(t=>t.symbol === q.symbol)?.symbol || 'N/A'}</span> 
              {/* 6. Use 'close' price from synthetic data */}
              <span className="text-white/80">${q.close?.toFixed(2) || 'N/A'}</span> 
              {/* 7. Use calculated change */}
              <span className={isUp ? 'text-green-500' : 'text-red-500'}> {/* Tailwind classes for bull/bear */}
                {isUp ? '+' : ''}{change?.toFixed(2) || 'N/A'} ({changePercent?.toFixed(2) || 'N/A'}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTicker;