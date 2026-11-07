import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import axiosClient from '../api/axiosClient';
import MetricCard from '../components/cards/MetricCard';
import ProgressBar from '../components/common/ProgressBar';
import { CardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = {
  Completed: '#10b981',
  'In Progress': '#3b82f6',
  'Not Started': '#94a3b8',
  Paused: '#f59e0b',
  Cancelled: '#f43f5e',
};

const AnalyticsPage = () => {
  const { showToast } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [subjectsData, setSubjectsData] = useState([]);
  const [hoursData, setHoursData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        setLoading(true);
        const [dashRes, subjRes, hrsRes] = await Promise.all([
          axiosClient.get('/analytics/dashboard'),
          axiosClient.get('/analytics/subjects'),
          axiosClient.get('/analytics/study-hours'),
        ]);

        if (dashRes.data.success) setDashboardData(dashRes.data.data);
        if (subjRes.data.success) setSubjectsData(subjRes.data.data);
        if (hrsRes.data.success) setHoursData(hrsRes.data.data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-slate-200 rounded w-36 animate-pulse" />
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 rounded-3xl animate-pulse" />
          <div className="h-72 bg-slate-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const {
    summary = {},
    weeklyStudyHours = [],
    goalsByPriority = {},
  } = dashboardData || {};

  const priorityChartData = [
    { name: 'Urgent', count: goalsByPriority.Urgent || 0, color: '#f43f5e' },
    { name: 'High', count: goalsByPriority.High || 0, color: '#f97316' },
    { name: 'Medium', count: goalsByPriority.Medium || 0, color: '#3b82f6' },
    { name: 'Low', count: goalsByPriority.Low || 0, color: '#94a3b8' },
  ].filter((p) => p.count > 0);

  const goalCompletionData = [
    { name: 'Completed', value: summary.completedGoals || 0, color: '#10b981' },
    { name: 'In Progress / Pending', value: summary.pendingGoals || 0, color: '#6366f1' },
    { name: 'Overdue', value: summary.overdueGoals || 0, color: '#f43f5e' },
  ].filter((g) => g.value > 0);

  const hoursBySubject = hoursData?.hoursBySubject || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Learning Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Comprehensive visual metrics on subject progress, goal completions, and study consistency
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Goal Completion"
          value={`${summary.totalGoals > 0 ? Math.round(((summary.completedGoals || 0) / summary.totalGoals) * 100) : 0}%`}
          subtitle={`${summary.completedGoals || 0} of ${summary.totalGoals || 0} goals`}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Logged Study Time"
          value={`${summary.actualHours || 0}h`}
          subtitle="Real verified sessions"
          icon={Clock}
          color="indigo"
        />
        <MetricCard
          title="Active Subjects"
          value={summary.activeSubjects || 0}
          subtitle={`Out of ${summary.totalSubjects || 0} total`}
          icon={BookOpen}
          color="blue"
        />
        <MetricCard
          title="Overdue Tasks"
          value={summary.overdueGoals || 0}
          subtitle={summary.overdueGoals > 0 ? 'Requires attention' : 'All goals on track'}
          icon={Target}
          color={summary.overdueGoals > 0 ? 'rose' : 'purple'}
        />
      </div>

      {/* Row 1: Weekly Progress Bar Chart & Goal Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Hours */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Daily Study Hours (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Total study time logged per day across all courses
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              Hours vs Day
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
                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goals Distribution Donut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Goals Status Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Proportion of completed, pending, and overdue goals
            </p>

            <div className="h-52 w-full flex items-center justify-center">
              {goalCompletionData.length === 0 ? (
                <p className="text-xs text-slate-400">No goals found</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalCompletionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {goalCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} goals`, name]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {goalCompletionData.map((g) => (
              <div key={g.name} className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-slate-600">{g.name}</span>
                </div>
                <span className="text-slate-800">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Subject Progress Bars & Study Hours by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Syllabus Progress */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Subject Syllabus Completion Rates
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Percentage calculated from completed topics in each subject
          </p>

          <div className="space-y-4">
            {subjectsData.map((subj) => {
              const pct = subj.status === 'Completed' ? 100 : subj.progressPercentage;
              return (
                <div key={subj.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: subj.color }}
                      />
                      <span className="text-slate-800">{subj.name}</span>
                      {subj.code && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({subj.code})
                        </span>
                      )}
                    </div>
                    <span className="text-indigo-600">{pct}%</span>
                  </div>
                  <ProgressBar
                    progress={pct}
                    color={subj.color}
                    showLabel={false}
                    height="h-2"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>
                      {subj.completedTopics}/{subj.totalTopics} topics completed
                    </span>
                    <span>{subj.completedStudyHours} hrs logged</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Hours Distribution by Subject */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Study Hours by Subject
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Total focused hours invested in each course
          </p>

          <div className="h-64 w-full">
            {hoursBySubject.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No study hours logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursBySubject} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val} hrs`, 'Logged Time']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                    {hoursBySubject.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
