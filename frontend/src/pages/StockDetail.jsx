import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockDetail = () => {
  const { ticker } = useParams();
  // Ensure getStockChart is retrieved from context if needed, 
  // or use stockData directly if getStockChart now returns the full array
  const { getStockData, stockData: contextStockData } = useWatchlist(); // Get the full data cache
  const [stockDetails, setStockDetails] = useState(null); // Will hold the latest data point
  const [chartArray, setChartArray] = useState(null); // Will hold the full array for the chart
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1Y'); // Default to 1 Year for synthetic data

  useEffect(() => {
    fetchStockDetails(); // Fetch latest details
    fetchChartArray(); // Fetch the full array for charting
  }, [ticker, contextStockData]); // Re-fetch if ticker or the main data cache changes

  // Fetch the LATEST data point for display
  const fetchStockDetails = async () => {
    setLoading(true);
    // Use the context function which gets the latest point
    const result = await getStockData(ticker); 
    if (result.success) {
      setStockDetails(result.data); // result.data is { date, open, high, low, close, ... }
    } else {
      console.error("Error fetching stock details:", result.error);
      setStockDetails(null); // Ensure data is null on error
    }
    setLoading(false);
  };

  // Fetch the FULL array for the chart
  const fetchChartArray = () => {
    // Directly access the full array from the context state
    const fullDataArray = contextStockData[ticker.toUpperCase()];
    if (fullDataArray) {
      setChartArray(fullDataArray);
    } else {
      setChartArray(null); // Ensure chart data is null if not found
    }
  };


  const formatPrice = (price) => {
    // Add a check for valid number before formatting
    if (typeof price !== 'number' || isNaN(price)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // --- MODIFICATION: Calculate change based on synthetic data ---
  const calculateChange = (details) => {
    if (!details || typeof details.close !== 'number' || typeof details.open !== 'number') {
      return { change: 0, changePercent: 0 };
    }
    const change = details.close - details.open;
    const changePercent = details.open === 0 ? 0 : (change / details.open) * 100;
    return { change, changePercent };
  };

  const formatChange = (details) => {
    const { change, changePercent } = calculateChange(details);
    
    // Add check here as well before formatting
    if (typeof change !== 'number' || typeof changePercent !== 'number' || isNaN(change) || isNaN(changePercent)) {
       return <span className="text-white/70">N/A</span>;
    }

    const isPositive = change >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
        {formatPrice(Math.abs(change))} ({Math.abs(changePercent).toFixed(2)}%)
      </span>
    );
  };

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Keep legend off for cleaner look
        },
        title: {
          display: true,
          text: `${ticker} Price History (Synthetic Data - ${selectedPeriod})`, // Update title
        },
        tooltip: { // Improve tooltip
           callbacks: {
              label: function(context) {
                 let label = context.dataset.label || '';
                 if (label) {
                    label += ': ';
                 }
                 if (context.parsed.y !== null) {
                    label += formatPrice(context.parsed.y);
                 }
                 return label;
              }
           }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return formatPrice(value);
            }
          }
        },
        x: {
          ticks: {
            maxTicksLimit: 10,
            // Format date labels better if needed
             callback: function(value, index, values) {
               // 'value' here is the index, 'this.getLabelForValue(value)' gets the actual date string
               const dateLabel = this.getLabelForValue(value);
               // You might want to format dateLabel further (e.g., show Month/Day)
               return dateLabel; 
             }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  };

  // --- MODIFICATION: Use the full chartArray state ---
  const getChartData = () => {
    // 1. Initial guard clause (this was already good)
    if (!chartArray || chartArray.length === 0) return null;

    // 2. --- FIX: Clean the array ---
    // Filter out any items that are null, undefined, or missing a 'date' property
    const cleanChartArray = chartArray.filter(item => item && item.date);

    // 3. --- FIX: Add a new guard clause ---
    // If the cleaning process resulted in an empty array, stop
    if (cleanChartArray.length === 0) return null;

    // --- Filter data based on selectedPeriod (Basic Example) ---
    
    // 4. --- FIX: Use the 'cleanChartArray' from now on ---
    let filteredData = cleanChartArray;
    
    // This line is now safe because we know the array isn't empty and has valid items
    const endDate = new Date(cleanChartArray[cleanChartArray.length - 1].date);
    let startDate = new Date(endDate);

    switch (selectedPeriod) {
      case '1D': 
        filteredData = cleanChartArray.slice(-1); 
        break;
      case '1W':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '1Y':
      default: 
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // 5. --- FIX: Use 'cleanChartArray' for filtering too ---
    if (selectedPeriod !== '1Y') {
       // We filter the already-clean array, so 'item.date' is safe to access
       filteredData = cleanChartArray.filter(item => new Date(item.date) >= startDate);
    }
    // --- End Period Filtering ---

    // These map functions are now also safe
    const labels = filteredData.map(item => item.date); // Use date from data
    const prices = filteredData.map(item => item.close); // Use close price

    return {
      labels,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 1, 
          fill: true,
          tension: 0.1,
          pointRadius: 0, 
        },
      ],
    };
  };

  // Keep periods, adjust default if needed
  const periods = [
    // { value: '1D', label: '1 Day' }, // Maybe remove 1D for daily data
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Use stockDetails for the check
  if (!stockDetails) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Stock data not found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- MODIFICATION: Calculate derived values here ---
  const { change, changePercent } = calculateChange(stockDetails);

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
             {/* --- MODIFICATION: Use ticker directly --- */}
            <h1 className="text-3xl font-bold text-white">{ticker.toUpperCase()}</h1>
            {/* Remove company name or fetch it differently */}
            {/* <p className="text-white/70 mt-1">{stockDetails.company_name}</p> */}
          </div>
          <button
            onClick={fetchStockDetails} // Keep refresh for latest point
            className="flex items-center space-x-2 text-white/70 hover:text-white"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stock Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                {/* --- MODIFICATION: Use 'close' price --- */}
                <div className="text-3xl font-bold text-white">
                  {formatPrice(stockDetails.close)}
                </div>
                <div className="mt-2">
                  {/* --- MODIFICATION: Use calculated change --- */}
                  {formatChange(stockDetails)} 
                </div>
              </div>
              <div className="text-right text-sm text-white/60">
                 {/* --- MODIFICATION: Remove/replace unavailable data --- */}
                {/* <div>Volume: {stockDetails.volume?.toLocaleString() || 'N/A'}</div> */}
                <div>Date: {stockDetails.date}</div> {/* Use date from synthetic data */}
              </div>
            </div>

            {/* Chart */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Price History</h3>
                <div className="flex space-x-2">
                  {periods.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)} // Re-renders chart on click
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedPeriod === period.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* --- MODIFICATION: Use chartArray for chart --- */}
              <div className="chart-container" style={{ height: '300px' }}> {/* Give chart container a height */}
                {chartArray ? ( // Check if chartArray exists
                  <Line data={getChartData()} options={getChartOptions()} />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/60">
                     {/* Show loader while chart array might be loading initially */}
                     {loading ? <Loader2 className="h-8 w-8 animate-spin text-blue-400" /> : "Chart data not available"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Details */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Stock Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Ticker</span>
                 {/* --- MODIFICATION: Use ticker directly --- */}
                <span className="font-medium text-white">{ticker.toUpperCase()}</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-white/70">Company</span>
                <span className="font-medium text-right text-white/90">{stockDetails.company_name}</span>
              </div> */}
              <div className="flex justify-between">
                 {/* --- MODIFICATION: Use 'close' price --- */}
                <span className="text-white/70">Current Price</span>
                <span className="font-medium text-white">{formatPrice(stockDetails.close)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Today's Change</span>
                 {/* --- MODIFICATION: Use calculated change --- */}
                <span className={`font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(change)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Change %</span>
                {/* --- MODIFICATION: Use calculated changePercent and fix TypeError source --- */}
                <span className={`font-medium ${changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {typeof changePercent === 'number' ? changePercent.toFixed(2) : 'N/A'}% 
                </span>
              </div>
              {/* --- MODIFICATION: Add synthetic data points --- */}
               <div className="flex justify-between">
                  <span className="text-white/70">Open</span>
                  <span className="font-medium text-white">{formatPrice(stockDetails.open)}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-white/70">High</span>
                  <span className="font-medium text-white">{formatPrice(stockDetails.high)}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-white/70">Low</span>
                  <span className="font-medium text-white">{formatPrice(stockDetails.low)}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-white/70">Date</span>
                  <span className="font-medium text-white">{stockDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">DPI</span>
                  <span className="font-medium text-white">{stockDetails.dpi?.toFixed(2) || 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-white/70">Analyst Momentum</span>
                  <span className="font-medium text-white">{stockDetails.analyst_momentum?.toFixed(4) || 'N/A'}</span>
                </div>
            </div>
          </div>

          {/* Quick Actions (Keep as is or adapt later) */}
          <div className="glass-card rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {/* These buttons likely need functionality added */}
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Add/Remove from Watchlist
              </button>
              <button className="w-full bg-white/10 text-white/80 py-2 px-4 rounded-md hover:bg-white/20 transition-colors">
                Set Price Alert
              </button>
              <button className="w-full bg-white/10 text-white/80 py-2 px-4 rounded-md hover:bg-white/20 transition-colors">
                View News
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;