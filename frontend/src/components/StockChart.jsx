// src/components/StockChart.jsx

import React from 'react';
import { useWatchlist } from '../contexts/WatchlistContext'; // Import your hook
import { Line } from 'react-chartjs-2';

// --- IMPORTANT: Chart.js 101 ---
// You must import and register the components you want to use
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
// --- End of Chart.js setup ---


// This component expects a 'ticker' prop, like "AAPL" or "TSLA"
const StockChart = ({ ticker }) => {
  // 1. Get the global stock data from your context
  const { stockData } = useWatchlist();

  // 2. Find the specific time-series data for this stock
  const dataForThisStock = stockData[ticker];

  // 3. Handle the case where data isn't loaded yet
  if (!dataForThisStock) {
    // You can return a loading spinner here
    return <div>Click a stock to load its chart...</div>;
  }

  // 4. Format the data for Chart.js
  const chartData = {
    labels: dataForThisStock.map(d => d.date), // X-axis (dates)
    datasets: [
      {
        label: `${ticker} Price ($)`,
        data: dataForThisStock.map(d => d.close), // Y-axis (closing prices)
        borderColor: '#22d3ee', // Your theme's accent color
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        pointRadius: 0, // No dots on the line
        tension: 0.1, // Makes the line slightly curved
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false, // Hide X-axis labels for a cleaner look
      },
      y: {
        ticks: {
          // Add a '$' prefix to Y-axis labels
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  // Get the latest data point to display the niche metrics
  const latestData = dataForThisStock[dataForThisStock.length - 1];

  return (
    <div style={{ padding: '20px' }}>
      <h3>{ticker} 1-Year Performance</h3>
      <Line options={chartOptions} data={chartData} />
      
      <h4>Niche Metrics (From Synthetic Data):</h4>
      <ul>
        <li>Latest Dark Pool Index (DPI): {latestData.dpi}</li>
        <li>Analyst Rating Momentum: {latestData.analyst_momentum.toFixed(4)}</li>
      </ul>
    </div>
  );
};

export default StockChart;