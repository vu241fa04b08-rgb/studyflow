import React from 'react';
import {
  getStatusBadgeStyle,
  getPriorityBadgeStyle,
  getDifficultyBadgeStyle,
} from '../../utils/formatters';

export const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs ${getPriorityBadgeStyle(
        priority
      )}`}
    >
      {priority}
    </span>
  );
};

export const DifficultyBadge = ({ difficulty }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getDifficultyBadgeStyle(
        difficulty
      )}`}
    >
      {difficulty}
    </span>
  );
};
