import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Target, Calendar, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';

const goalSchema = z
  .object({
    subjectId: z.string().min(1, 'Please select a subject'),
    chapterId: z.string().optional(),
    title: z.string().min(2, 'Goal title must be at least 2 characters').max(150),
    description: z.string().max(1000).optional(),
    type: z.enum([
      'Daily goal',
      'Weekly goal',
      'Monthly goal',
      'Subject completion goal',
      'Chapter completion goal',
      'Exam preparation goal',
      'Custom goal',
    ]),
    startDate: z.string().min(1, 'Start date is required'),
    deadline: z.string().min(1, 'Deadline date is required'),
    targetHours: z.coerce.number().min(0.1, 'Target study hours must be at least 0.1 hour'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
    status: z.enum(['Not Started', 'In Progress', 'Completed', 'Paused', 'Cancelled']),
  })
  .refine((data) => new Date(data.deadline) >= new Date(data.startDate), {
    message: 'Deadline cannot be before the start date',
    path: ['deadline'],
  });

const CreateGoalPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      subjectId: '',
      chapterId: '',
      title: '',
      description: '',
      type: 'Weekly goal',
      startDate: todayStr,
      deadline: nextWeekStr,
      targetHours: 5,
      priority: 'High',
      status: 'In Progress',
    },
  });

  const selectedSubjectId = watch('subjectId');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axiosClient.get('/subjects?limit=50');
        if (res.data.success) {
          setSubjects(res.data.data);
        }
      } catch (err) {
        showToast('Failed to load subjects', 'error');
      }
    };
    fetchSubjects();
  }, []);

  // When subject changes, fetch chapters for that subject
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      try {
        const res = await axiosClient.get(`/subjects/${selectedSubjectId}/chapters`);
        if (res.data.success) {
          setChapters(res.data.data);
        }
      } catch (err) {
        setChapters([]);
      }
    };
    fetchChapters();
  }, [selectedSubjectId]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        chapterId: data.chapterId ? data.chapterId : null,
      };

      const res = await axiosClient.post('/goals', payload);
      if (res.data.success) {
        showToast('Study goal created successfully!', 'success');
        navigate('/goals');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create goal';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/goals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Goals</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Create New Study Goal
            </h1>
            <p className="text-xs text-slate-500">
              Set clear objectives, commit to target hours, and assign deadlines
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Goal Title *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Complete DBMS Unit 1, Master Dynamic Programming"
              className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                errors.title ? 'border-rose-500' : 'border-slate-200'
              } rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium`}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Describe what you plan to accomplish, problem sets, or chapters involved..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Subject & Chapter Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Subject *
              </label>
              <select
                {...register('subjectId')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.subjectId ? 'border-rose-500' : 'border-slate-200'
                } rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.code ? `(${s.code})` : ''}
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.subjectId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Related Chapter (Optional)
              </label>
              <select
                {...register('chapterId')}
                disabled={!selectedSubjectId || chapters.length === 0}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
              >
                <option value="">-- General / Whole Subject --</option>
                {chapters.map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Goal Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Goal Type
              </label>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="Daily goal">Daily goal</option>
                <option value="Weekly goal">Weekly goal</option>
                <option value="Monthly goal">Monthly goal</option>
                <option value="Subject completion goal">Subject completion goal</option>
                <option value="Chapter completion goal">Chapter completion goal</option>
                <option value="Exam preparation goal">Exam preparation goal</option>
                <option value="Custom goal">Custom goal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="Urgent">Urgent Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Target Hours, Start Date, Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Hours *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  {...register('targetHours')}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                    errors.targetHours ? 'border-rose-500' : 'border-slate-200'
                  } rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                  hrs
                </span>
              </div>
              {errors.targetHours && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.targetHours.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Deadline *
              </label>
              <input
                type="date"
                {...register('deadline')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.deadline ? 'border-rose-500' : 'border-slate-200'
                } rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
              />
              {errors.deadline && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.deadline.message}
                </p>
              )}
            </div>
          </div>

          {/* Goal Initial Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Initial Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/goals"
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Creating Goal...' : 'Save Study Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGoalPage;
