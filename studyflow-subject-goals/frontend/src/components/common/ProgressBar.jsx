import React from 'react';

const ProgressBar = ({
  progress = 0,
  color = '#6366f1',
  height = 'h-2',
  showLabel = true,
  className = '',
}) => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="font-semibold text-slate-700">{safeProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${safeProgress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
