import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import axiosClient from '../api/axiosClient';
import MetricCard from '../components/cards/MetricCard';
import SubjectCard from '../components/cards/SubjectCard';
import GoalCard from '../components/cards/GoalCard';
import ProgressBar from '../components/common/ProgressBar';
import { CardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

const DashboardPage = () => {
  const { user } = useAuth();
  const { openLogModal } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await axiosClient.get('/analytics/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to session logged event to update in real time
    const handleSessionLogged = () => {
      fetchDashboardData();
    };
    window.addEventListener('studyflow:sessionLogged', handleSessionLogged);
    return () => window.removeEventListener('studyflow:sessionLogged', handleSessionLogged);
  }, []);

  const handleGoalStatusChange = async (goalId, newStatus) => {
    try {
      await axiosClient.patch(`/goals/${goalId}/status`, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse" />
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const {
    summary = {},
    todaysGoals = [],
    upcomingGoals = [],
    activeGoals = [],
    recentActivity = {},
    subjectProgress = [],
    weeklyStudyHours = [],
  } = data || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome Back, {user?.name?.split(' ')[0] || 'Student'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Stay Focused. Track Consistency.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              You have logged <strong className="text-indigo-400 font-bold">{summary.actualHours || 0} hours</strong> of real study time across <strong className="text-white font-bold">{summary.totalSubjects || 0} subjects</strong>. Keep the momentum going!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openLogModal()}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Study Session</span>
            </button>
            <Link
              to="/goals/new"
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all"
            >
              + New Goal
            </Link>
          </div>
        </div>
      </div>

      {/* 8 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Subjects"
          value={summary.totalSubjects || 0}
          subtitle={`${summary.activeSubjects || 0} currently active`}
          icon={BookOpen}
          color="indigo"
        />
        <MetricCard
          title="Active Goals"
          value={summary.pendingGoals || 0}
          subtitle={`${summary.completedGoals || 0} completed`}
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Actual Study Hours"
          value={`${summary.actualHours || 0}h`}
          subtitle={`Target: ${summary.estimatedHours || 0}h total`}
          icon={Clock}
          color="emerald"
        />
        <MetricCard
          title="Overdue Goals"
          value={summary.overdueGoals || 0}
          subtitle={summary.overdueGoals > 0 ? 'Requires attention' : 'All goals on track'}
          icon={AlertCircle}
          color={summary.overdueGoals > 0 ? 'rose' : 'purple'}
        />
      </div>

      {/* SECTION G & H: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Hours Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Weekly Study Progress (Hours Logged)
              </h3>
              <p className="text-xs text-slate-500">
                Daily study hours logged over the last 7 days
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStudyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} hrs`, 'Study Time']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {weeklyStudyHours.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.hours > 0 ? '#6366f1' : '#e2e8f0'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION F: Subject-wise Completion Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Subject Completion
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real topic completion percentage by subject
            </p>

            <div className="space-y-3.5 overflow-y-auto max-h-56 pr-1">
              {subjectProgress.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No subjects created yet.</p>
              ) : (
                subjectProgress.map((subj) => {
                  const pct = subj.status === 'Completed' ? 100 : subj.progressPercentage;
                  return (
                    <div key={subj.id}>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 truncate max-w-[180px]">{subj.name}</span>
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                      <ProgressBar
                        progress={pct}
                        color={subj.color}
                        showLabel={false}
                        height="h-1.5"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            to="/analytics"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5"
          >
            <span>View Full Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION A: My Subjects (Show with progress bars) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">My Subjects</h2>
            <p className="text-xs text-slate-500">
              Overview of your registered academic courses and chapters
            </p>
          </div>
          <Link
            to="/subjects"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All ({summary.totalSubjects || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {subjectProgress.length === 0 ? (
          <EmptyState
            title="No Subjects Added"
            description="Create your first subject (e.g. Data Structures, DBMS) to organize chapters and track topic progress."
            actionText="+ Create Subject"
            onAction={() => window.location.href = '/subjects'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjectProgress.slice(0, 3).map((subj) => (
              <SubjectCard key={subj.id} subject={subj} />
            ))}
          </div>
        )}
      </div>

      {/* SECTION B & C: Today's Goals & Upcoming Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Goals */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800">Today's Goals</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {todaysGoals.length} Due
            </span>
          </div>

          {todaysGoals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No goals scheduled specifically for today. Enjoy your day or work ahead!
            </div>
          ) : (
            <div className="space-y-3">
              {todaysGoals.map((g) => (
                <GoalCard
                  key={g._id}
                  goal={g}
                  onStatusChange={handleGoalStatusChange}
                  onLogTime={(goal) => openLogModal({ subjectId: goal.subjectId?._id, goalId: goal._id })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Goals */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Upcoming Goals (Next 7 Days)</h3>
            <Link
              to="/goals"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              See All
            </Link>
          </div>

          {upcomingGoals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No goals due in the next 7 days.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingGoals.slice(0, 3).map((g) => (
                <GoalCard
                  key={g._id}
                  goal={g}
                  onStatusChange={handleGoalStatusChange}
                  onLogTime={(goal) => openLogModal({ subjectId: goal.subjectId?._id, goalId: goal._id })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION E: Recent Activity */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
            <p className="text-xs text-slate-500">
              Recent study sessions recorded and milestones
            </p>
          </div>
          <Link
            to="/study-history"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Study History
          </Link>
        </div>

        {(!recentActivity.recentEntries || recentActivity.recentEntries.length === 0) ? (
          <p className="text-xs text-slate-400 py-6 text-center">No study activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.recentEntries.map((entry) => (
              <div key={entry._id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.subjectId?.color || '#6366f1' }}
                  />
                  <div>
                    <span className="font-bold text-slate-800">
                      {entry.subjectId?.name || 'General Study'}
                    </span>
                    {entry.goalId && (
                      <span className="text-slate-400 ml-1.5">
                        • Goal: {entry.goalId.title}
                      </span>
                    )}
                    {entry.notes && (
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1 italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    +{entry.durationMinutes} mins ({(entry.durationMinutes / 60).toFixed(1)}h)
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {formatDate(entry.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
