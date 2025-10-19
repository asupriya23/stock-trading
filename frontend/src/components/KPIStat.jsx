import React from 'react';

const KPIStat = ({ label, value, delta, positive = true }) => {
  return (
    <div className="kpi-card">
      <div className="text-xs uppercase tracking-wider text-white/60">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {delta !== undefined && (
        <div className={`mt-1 text-sm ${positive ? 'bull' : 'bear'}`}>
          {positive ? '+' : ''}{delta}
        </div>
      )}
    </div>
  );
};

export default KPIStat;


