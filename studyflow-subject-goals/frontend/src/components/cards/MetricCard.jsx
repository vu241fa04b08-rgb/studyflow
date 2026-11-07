import React from 'react';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo', // indigo, blue, emerald, amber, rose, purple
  trend,
  className = '',
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'border-slate-200/80',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-slate-200/80',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-slate-200/80',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-slate-200/80',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-slate-200/80',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'border-slate-200/80',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${scheme.border} shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between ${className}`}
    >
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>

      {Icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 ${scheme.bg}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
