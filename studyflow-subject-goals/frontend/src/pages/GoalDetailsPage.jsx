import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Clock,
  Calendar,
  AlertCircle,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import ProgressBar from '../components/common/ProgressBar';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatDate, getRemainingDays } from '../utils/formatters';

const GoalDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openLogModal } = useOutletContext();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // For study entry deletion inside goal
  const [deleteEntryId, setDeleteEntryId] = useState(null);

  const fetchGoalDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/goals/${id}`);
      if (res.data.success) {
        setGoal(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load goal details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalDetails();

    const handleLogged = () => {
      fetchGoalDetails();
    };
    window.addEventListener('studyflow:sessionLogged', handleLogged);
    return () => window.removeEventListener('studyflow:sessionLogged', handleLogged);
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await axiosClient.patch(`/goals/${id}/status`, { status: newStatus });
      showToast(`Goal marked as ${newStatus}`, 'success');
      fetchGoalDetails();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteGoal = async () => {
    setDeleting(true);
    try {
      await axiosClient.delete(`/goals/${id}`);
      showToast('Study goal deleted successfully', 'success');
      navigate('/goals');
    } catch (err) {
      showToast('Failed to delete goal', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    try {
      await axiosClient.delete(`/study-entries/${deleteEntryId}`);
      showToast('Study session deleted and progress recalculated', 'success');
      setDeleteEntryId(null);
      fetchGoalDetails();
    } catch (err) {
      showToast('Failed to delete study entry', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!goal) {
    return (
      <EmptyState
        title="Study Goal Not Found"
        description="The goal requested does not exist."
        actionText="Back to Goals"
        onAction={() => navigate('/goals')}
      />
    );
  }

  const daysLeft = getRemainingDays(goal.deadline);
  const entries = goal.entries || [];
  const subjectName = goal.subjectId?.name || 'General';
  const subjectColor = goal.subjectId?.color || '#6366f1';

  const displayProgress =
    goal.status === 'Completed' || (goal.targetHours > 0 && goal.actualHours >= goal.targetHours)
      ? 100
      : (goal.progressPercentage || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back link */}
      <div>
        <Link
          to="/goals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Goals</span>
        </Link>
      </div>

      {/* Goal Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: subjectColor }}
        />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-2">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: subjectColor }}
              />
              <span className="text-xs font-bold text-slate-700">
                {subjectName}
              </span>
              {goal.chapterId && (
                <span className="text-xs text-slate-400">
                  • {goal.chapterId.title}
                </span>
              )}
              <PriorityBadge priority={goal.priority} />
              <StatusBadge status={goal.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {goal.title}
            </h1>

            {goal.description && (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                {goal.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-slate-500">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                {goal.type}
              </span>

              {goal.isOverdue && goal.status !== 'Completed' ? (
                <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Overdue by {Math.abs(daysLeft)} days
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Due today'} ({formatDate(goal.deadline)})
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to={`/goals/${id}/edit`}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
              title="Edit Goal"
            >
              <Edit2 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Delete Goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Breakdown Box */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>
                Completed {goal.actualHours} hrs of {goal.targetHours} hrs target
              </span>
              <span className="text-indigo-600 text-sm font-extrabold">
                {displayProgress}%
              </span>
            </div>
            <ProgressBar
              progress={displayProgress}
              color={subjectColor}
              showLabel={false}
              height="h-3"
            />
          </div>

          <div className="flex sm:justify-end gap-2">
            <button
              onClick={() =>
                openLogModal({
                  subjectId: goal.subjectId?._id,
                  goalId: goal._id,
                  chapterId: goal.chapterId?._id,
                })
              }
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Session</span>
            </button>
          </div>
        </div>

        {/* Status Switcher Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {goal.status !== 'Completed' && (
            <button
              onClick={() => handleStatusChange('Completed')}
              className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Complete</span>
            </button>
          )}

          {goal.status === 'In Progress' && (
            <button
              onClick={() => handleStatusChange('Paused')}
              className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold flex items-center gap-1 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Goal</span>
            </button>
          )}

          {goal.status === 'Paused' && (
            <button
              onClick={() => handleStatusChange('In Progress')}
              className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold flex items-center gap-1 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Goal</span>
            </button>
          )}

          {goal.status === 'Completed' && (
            <button
              onClick={() => handleStatusChange('In Progress')}
              className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Goal</span>
            </button>
          )}
        </div>
      </div>

      {/* Logged Study Activity Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Study Sessions Logged ({entries.length})
            </h3>
            <p className="text-xs text-slate-500">
              Verified sessions contributing to this goal's actual hours
            </p>
          </div>
          <button
            onClick={() =>
              openLogModal({
                subjectId: goal.subjectId?._id,
                goalId: goal._id,
                chapterId: goal.chapterId?._id,
              })
            }
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Session</span>
          </button>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No study sessions logged yet"
            description="Log your daily study time against this goal to track actual progress."
            actionText="+ Log Study Time"
            onAction={() =>
              openLogModal({
                subjectId: goal.subjectId?._id,
                goalId: goal._id,
                chapterId: goal.chapterId?._id,
              })
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Topic / Notes</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      {entry.topicId && (
                        <span className="font-semibold text-slate-800 block">
                          Topic: {entry.topicId.title}
                        </span>
                      )}
                      <span className="text-slate-500 italic">
                        {entry.notes || 'General study session'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-indigo-600">
                      {entry.durationMinutes} mins ({(entry.durationMinutes / 60).toFixed(1)} hrs)
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setDeleteEntryId(entry._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Goal Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteGoal}
        title={`Delete Goal "${goal.title}"?`}
        message="This action will delete the study goal. Study sessions will remain in your study history."
        confirmText="Delete Goal"
        isLoading={deleting}
      />

      {/* Delete Entry Dialog */}
      <ConfirmDialog
        isOpen={!!deleteEntryId}
        onClose={() => setDeleteEntryId(null)}
        onConfirm={handleDeleteEntry}
        title="Delete this study session?"
        message="Deleting this session will automatically decrease the goal actual hours and recalculate progress."
        confirmText="Delete Session"
      />
    </div>
  );
};

export default GoalDetailsPage;
