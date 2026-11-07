import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, CheckCircle2, ChevronRight, MoreVertical } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  const {
    _id,
    name,
    code,
    category,
    color = '#6366f1',
    status,
    totalChapters = 0,
    totalTopics = 0,
    completedTopics = 0,
    pendingTopics = 0,
    progressPercentage = 0,
    estimatedHours = 0,
    completedStudyHours = 0,
    targetDate,
  } = subject;

  const displayProgress = status === 'Completed' ? 100 : progressPercentage;

  return (
    <div className="group bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      {/* Top Color Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: color }}
      />

      <div>
        {/* Header: Code/Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          <div className="flex items-center gap-2">
            {code && (
              <span className="px-2 py-0.5 text-xs font-mono font-bold uppercase rounded-md bg-slate-100 text-slate-700">
                {code}
              </span>
            )}
            <span className="text-xs font-medium text-slate-400">
              {category}
            </span>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Title */}
        <Link
          to={`/subjects/${_id}`}
          className="block group-hover:text-indigo-600 transition-colors"
        >
          <h3 className="text-base font-bold text-slate-800 line-clamp-1 mb-1.5">
            {name}
          </h3>
        </Link>

        {/* Topic & Chapter Count pills */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>{totalChapters} {totalChapters === 1 ? 'Chapter' : 'Chapters'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {completedTopics}/{totalTopics} Topics
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <ProgressBar progress={displayProgress} color={color} />
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {completedStudyHours}h / {estimatedHours || 0}h
          </span>
        </div>

        <div className="flex items-center gap-2">
          {targetDate && (
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(targetDate)}</span>
            </div>
          )}
          <Link
            to={`/subjects/${_id}`}
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Details"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;
