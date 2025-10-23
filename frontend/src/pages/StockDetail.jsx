import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWatchlist } from '../contexts/WatchlistContext';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Loader2,
  RefreshCw,
  Bell
} from 'lucide-react';
import PriceAlertModal from '../components/PriceAlertModal';
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
  Filler,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

const StockDetail = () => {
  const { ticker } = useParams();
  const { getStockData, getStockChart } = useWatchlist(); 
  
  const [stockDetails, setStockDetails] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);

  useEffect(() => {
    fetchStockDetails();
  }, [ticker]);

  useEffect(() => {
    fetchChartDetails();
  }, [ticker, selectedPeriod]);

  // Real-time polling: fetch both stock details and chart data every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStockDetails(false); // Don't show loading on updates
      fetchChartDetails(false); // Don't show loading on updates
    }, 3000); // 3 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [ticker, selectedPeriod]);

  const fetchStockDetails = async (isInitialLoad = true) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    const result = await getStockData(ticker); 
    if (result.success) {
      setStockDetails(result.data);
    } else {
      console.error("Error fetching stock details:", result.error);
      if (isInitialLoad) {
        setStockDetails(null);
      }
    }
    if (isInitialLoad) {
      setLoading(false);
    }
  };

  const fetchChartDetails = async (isInitialLoad = true) => {
    if (isInitialLoad) {
      setLoadingChart(true);
    }
    const result = await getStockChart(ticker, selectedPeriod);
    if (result.success) {
      setChartData(result.data);
    } else {
      console.error("Error fetching chart data:", result.error);
      if (isInitialLoad) {
        setChartData(null);
      }
    }
    if (isInitialLoad) {
      setLoadingChart(false);
    }
  };


  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatChange = (details) => {
    if (!details || typeof details.change !== 'number' || typeof details.change_percent !== 'number') {
      return <span className="text-white/70">N/A</span>;
    }
    
    const { change, change_percent } = details;
    const isPositive = change >= 0;

    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
        {formatPrice(Math.abs(change))} ({Math.abs(change_percent).toFixed(2)}%)
      </span>
    );
  };

  // 2. Memoize chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0 // Disable animations for smooth real-time updates
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `${ticker.toUpperCase()} Price History (${selectedPeriod})`,
          color: 'rgba(255, 255, 255, 0.9)'
        },
        tooltip: {
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
            },
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: selectedPeriod === '1W' ? 'week' : 'day',
            tooltipFormat: 'PP HH:mm',
            displayFormats: {
               'day': 'MMM d',
               'week': 'MMM d'
            }
          },
          ticks: {
            maxTicksLimit: 10,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }, [ticker, selectedPeriod]); // Dependencies: ticker and selectedPeriod

  // Memoize chart data
  const memoizedChartData = useMemo(() => {
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return {
        datasets: [],
      };
    }

    // Format data as {x, y} pairs for time scale
    const dataPoints = chartData.data.map(item => ({
      x: new Date(item.timestamp),
      y: item.price
    }));

    return {
      datasets: [
        {
          label: 'Price',
          data: dataPoints,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2, 
          fill: true,
          tension: 0.1,
          pointRadius: 0, 
        },
      ],
    };
  }, [chartData]);

  const periods = [
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '1Y', label: '1Y' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stockDetails) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Stock data not found</h1>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { change, change_percent } = stockDetails;

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
            <h1 className="text-3xl font-bold text-white">{stockDetails.ticker || ticker.toUpperCase()}</h1>
            <p className="text-white/70 mt-1">{stockDetails.company_name}</p>
          </div>
          <button
            onClick={fetchStockDetails}
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
                <div className="text-3xl font-bold text-white">
                  {formatPrice(stockDetails.current_price)}
                </div>
                <div className="mt-2">
                  {formatChange(stockDetails)} 
                </div>
              </div>
              <div className="text-right text-sm text-white/60">
                <div>Volume: {stockDetails.volume?.toLocaleString() || 'N/A'}</div>
                <div>Last Updated: {new Date(stockDetails.last_updated).toLocaleString()}</div>
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
                      onClick={() => setSelectedPeriod(period.value)}
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
              
              {/* Chart Area */}
              <div className="chart-container relative" style={{ height: '300px' }}>
                {loadingChart ? (
                  <div className="flex items-center justify-center h-full text-white/60">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : !chartData || !chartData.data || chartData.data.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/60">
                    Chart data not available
                  </div>
                ) : (
                  <Line
                    data={memoizedChartData}
                    options={chartOptions}
                  />
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
                <span className="font-medium text-white">{stockDetails.ticker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Company</span>
                <span className="font-medium text-right text-white/90">{stockDetails.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Current Price</span>
                <span className="font-medium text-white">{formatPrice(stockDetails.current_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Today's Change</span>
                <span className={`font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPrice(change)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Change %</span>
                <span className={`font-medium ${change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {typeof change_percent === 'number' ? change_percent.toFixed(2) : 'N/A'}% 
                </span>
              </div>
               <div className="flex justify-between">
                  <span className="text-white/70">Volume</span>
                  <span className="font-medium text-white">{stockDetails.volume?.toLocaleString() || 'N/A'}</span>
                </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              
              <button 
                onClick={() => setShowPriceAlertModal(true)}
                className="w-full bg-white/10 text-white/80 py-2 px-4 rounded-md hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span>Set Price Alert</span>
              </button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Price Alert Modal */}
      {showPriceAlertModal && (
        <PriceAlertModal
          ticker={ticker.toUpperCase()}
          currentPrice={stockDetails?.current_price}
          onClose={() => setShowPriceAlertModal(false)}
        />
      )}
    </div>
  );
};

export default StockDetail;