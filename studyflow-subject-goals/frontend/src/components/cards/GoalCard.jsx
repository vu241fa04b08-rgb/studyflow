import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, AlertCircle, Play, Pause, CheckCircle2, ChevronRight, PlusCircle } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { formatDate, getRemainingDays } from '../../utils/formatters';

const GoalCard = ({
  goal,
  onStatusChange,
  onLogTime,
  onDelete,
}) => {
  const {
    _id,
    title,
    type,
    subjectId,
    chapterId,
    targetHours = 0,
    actualHours = 0,
    priority,
    status,
    deadline,
    progressPercentage = 0,
    isOverdue,
  } = goal;

  const daysLeft = getRemainingDays(deadline);
  const subjectName = subjectId ? subjectId.name : 'General Subject';
  const subjectColor = subjectId ? subjectId.color : '#6366f1';

  const displayProgress =
    status === 'Completed' || (targetHours > 0 && actualHours >= targetHours)
      ? 100
      : progressPercentage;

  return (
    <div className="group bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Subject & Priority Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: subjectColor }}
            />
            <span className="text-xs font-semibold text-slate-600 truncate">
              {subjectName}
            </span>
            {chapterId && (
              <span className="text-xs text-slate-400 truncate">
                • {chapterId.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <PriorityBadge priority={priority} />
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Goal Title */}
        <Link
          to={`/goals/${_id}`}
          className="block group-hover:text-indigo-600 transition-colors mb-2"
        >
          <h4 className="text-base font-bold text-slate-800 line-clamp-2">
            {title}
          </h4>
        </Link>

        {/* Goal Type */}
        <div className="text-xs text-slate-400 font-medium mb-3">
          {type}
        </div>

        {/* Progress Bar & Hours */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>
              {actualHours} / {targetHours} hrs logged
            </span>
            <span className="text-indigo-600">{displayProgress}%</span>
          </div>
          <ProgressBar
            progress={displayProgress}
            color={subjectColor}
            showLabel={false}
          />
        </div>
      </div>

      {/* Footer: Deadline, Remaining Days & Quick Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {isOverdue && status !== 'Completed' ? (
            <span className="flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
              <AlertCircle className="w-3.5 h-3.5" />
              Overdue ({Math.abs(daysLeft)}d ago)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {daysLeft > 0 ? `${daysLeft} days left` : 'Due today'} ({formatDate(deadline)})
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {onLogTime && (
            <button
              onClick={() => onLogTime(goal)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Log Study Session"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}

          {status !== 'Completed' && onStatusChange && (
            <button
              onClick={() => onStatusChange(_id, 'Completed')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Mark Complete"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          <Link
            to={`/goals/${_id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="View Details"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
