// src/utils/syntheticData.js

/**
 * Generates synthetic time-series stock data using niche financial markers.
 * @param {number} days - The number of days of data to generate.
 * @param {number} initialPrice - The starting price of the stock.
 * @returns {Array<Object>} An array of daily stock data objects.
 */
export function generateSyntheticStockData(days = 252, initialPrice = 150) {
    const data = [];
    let price = initialPrice;
  
    // --- Base Financial Modeling Parameters ---
    const annualDrift = 0.15; // 15% annual upward trend (fundamental growth)
    const dailyDrift = annualDrift / 252; // Days in a trading year
    let annualVolatility = 0.30; // 30% annual volatility
  
    // --- Niche Marker State Variables ---
    let darkPoolIndex = 50; // Scale of 0-100. 50 is neutral.
    let analystMomentum = 0; // Starts neutral.
  
    for (let i = 0; i < days; i++) {
      let dailyVolatility = annualVolatility / Math.sqrt(252);
      const date = new Date();
      date.setDate(date.getDate() + i);
  
      // --- Marker 1: Implied Volatility (IV) Crush Simulation (Earnings Event) ---
      const isEarningsDay = i > 0 && i % 63 === 0; // Quarterly event
      let ivEventFlag = false;
      let earningsShock = 0;
  
      if (isEarningsDay) {
        ivEventFlag = true;
        const shockDirection = Math.random() > 0.5 ? 1 : -1;
        earningsShock = shockDirection * price * 0.08; // 8% price shock
        dailyVolatility *= 0.5; // Volatility is lower for a few days post-event
      } else if (i > 0 && i % 63 === 62) {
        // Day before earnings
        dailyVolatility *= 2.0; // Volatility doubles
      }
  
      // --- Marker 2: Dark Pool Index (DPI) Simulation ---
      darkPoolIndex += (Math.random() - 0.5) * 5;
      darkPoolIndex = Math.max(10, Math.min(90, darkPoolIndex)); // Clamp
      
      let dpiEffect = 0;
      if (darkPoolIndex > 75) dpiEffect = 0.001; // Institutional buying
      else if (darkPoolIndex < 25) dpiEffect = -0.001; // Institutional selling
  
      // --- Marker 3: Analyst Rating Momentum Simulation ---
      if (Math.random() < 0.05) analystMomentum += (Math.random() - 0.45);
      analystMomentum *= 0.99; // Momentum fades
      const momentumEffect = analystMomentum * 0.0005;
  
      // --- Price Calculation (Geometric Brownian Motion) ---
      const randomComponent = (Math.random() - 0.5) * 2 * dailyVolatility;
      const driftComponent = dailyDrift + dpiEffect + momentumEffect;
      
      const priceChange = price * (driftComponent + randomComponent) + earningsShock;
      const open = price;
      const close = price + priceChange;
  
      const high = Math.max(open, close) + Math.abs(priceChange * Math.random());
      const low = Math.min(open, close) - Math.abs(priceChange * Math.random());
  
      data.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        iv_event_flag: ivEventFlag,
        dpi: parseFloat(darkPoolIndex.toFixed(2)),
        analyst_momentum: parseFloat(analystMomentum.toFixed(2)),
      });
  
      price = close;
    }
  
    return data;
  }