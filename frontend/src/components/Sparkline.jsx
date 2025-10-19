import React, { useMemo } from 'react';

// Lightweight SVG sparkline to avoid heavy deps
const Sparkline = ({ data = [], width = 80, height = 28, stroke = '#22d3ee' }) => {
  const path = useMemo(() => {
    if (!data.length) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    return data
      .map((d, i) => {
        const x = i * step;
        const y = height - ((d - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!data.length) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
};

export default Sparkline;


