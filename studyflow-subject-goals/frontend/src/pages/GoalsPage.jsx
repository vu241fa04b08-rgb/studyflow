import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Target,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import GoalCard from '../components/cards/GoalCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

const goalTypes = [
  'All',
  'Daily goal',
  'Weekly goal',
  'Monthly goal',
  'Subject completion goal',
  'Chapter completion goal',
  'Exam preparation goal',
  'Custom goal',
];

const priorities = ['All', 'Urgent', 'High', 'Medium', 'Low'];

const statuses = [
  'All',
  'Not Started',
  'In Progress',
  'Completed',
  'Paused',
  'Cancelled',
];

const GoalsPage = () => {
  const { showToast } = useToast();
  const { openLogModal } = useOutletContext();

  const [goals, setGoals] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('All');
  const [type, setType] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');

  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    goal: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await axiosClient.get('/subjects?limit=50');
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {}
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (subjectId !== 'All') params.append('subjectId', subjectId);
      if (type !== 'All') params.append('type', type);
      if (priority !== 'All') params.append('priority', priority);
      if (status !== 'All') params.append('status', status);
      if (showOverdueOnly) params.append('isOverdue', 'true');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await axiosClient.get(`/goals?${params.toString()}`);
      if (res.data.success) {
        setGoals(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load study goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGoals();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, subjectId, type, priority, status, showOverdueOnly, sortBy, sortOrder]);

  const handleStatusChange = async (goalId, newStatus) => {
    try {
      await axiosClient.patch(`/goals/${goalId}/status`, { status: newStatus });
      showToast(`Goal marked as ${newStatus}`, 'success');
      fetchGoals();
    } catch (err) {
      showToast('Failed to update goal status', 'error');
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteConfirm.goal) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/goals/${deleteConfirm.goal._id}`);
      showToast('Study goal deleted successfully', 'success');
      setDeleteConfirm({ isOpen: false, goal: null });
      fetchGoals();
    } catch (err) {
      showToast('Failed to delete goal', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Study Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Set target study hours, manage deadlines, and record consistent progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openLogModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all"
          >
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Log Time</span>
          </button>
          <Link
            to="/goals/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search by Title */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search goals by title (e.g., Complete DBMS Unit 1, LeetCode Trees)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Quick Overdue Toggle */}
          <button
            onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 w-full md:w-auto justify-center ${
              showOverdueOnly
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
          </button>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Subject Filter */}
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Goal Type Filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {goalTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Goal Types' : t}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Priorities' : `${p} Priority`}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st === 'All' ? 'All Statuses' : st}
              </option>
            ))}
          </select>

          {/* Sort Selection */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 col-span-2 sm:col-span-1"
          >
            <option value="deadline:asc">Deadline (Soonest)</option>
            <option value="deadline:desc">Deadline (Latest)</option>
            <option value="createdAt:desc">Recently Created</option>
            <option value="priority:desc">Highest Priority</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No Study Goals Found"
          description={
            search || subjectId !== 'All' || status !== 'All' || showOverdueOnly
              ? 'No goals matched your filter selections. Try clearing your filters.'
              : 'You have not set any study goals yet. Create a goal to commit to target study hours and milestones!'
          }
          actionText={
            search || subjectId !== 'All' || status !== 'All' || showOverdueOnly
              ? 'Reset Filters'
              : '+ Create First Goal'
          }
          onAction={() => {
            if (search || subjectId !== 'All' || status !== 'All' || showOverdueOnly) {
              setSearch('');
              setSubjectId('All');
              setType('All');
              setPriority('All');
              setStatus('All');
              setShowOverdueOnly(false);
            } else {
              window.location.href = '/goals/new';
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onStatusChange={handleStatusChange}
              onLogTime={(g) =>
                openLogModal({
                  subjectId: g.subjectId?._id,
                  goalId: g._id,
                })
              }
              onDelete={() => setDeleteConfirm({ isOpen: true, goal })}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, goal: null })}
        onConfirm={handleDeleteGoal}
        title={`Delete "${deleteConfirm.goal?.title}"?`}
        message="Are you sure you want to delete this study goal? Logged study sessions will remain in your study history, but will no longer be linked to this goal."
        confirmText="Delete Goal"
        isLoading={deleting}
      />
    </div>
  );
};

export default GoalsPage;
