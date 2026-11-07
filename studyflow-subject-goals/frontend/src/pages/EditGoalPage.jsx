import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Target, CheckCircle2 } from 'lucide-react';
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

const EditGoalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
  });

  const selectedSubjectId = watch('subjectId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subjRes, goalRes] = await Promise.all([
          axiosClient.get('/subjects?limit=50'),
          axiosClient.get(`/goals/${id}`),
        ]);

        if (subjRes.data.success) {
          setSubjects(subjRes.data.data);
        }

        if (goalRes.data.success) {
          const g = goalRes.data.data;
          const startStr = g.startDate ? g.startDate.split('T')[0] : '';
          const deadStr = g.deadline ? g.deadline.split('T')[0] : '';

          reset({
            subjectId: g.subjectId?._id || g.subjectId,
            chapterId: g.chapterId?._id || g.chapterId || '',
            title: g.title,
            description: g.description || '',
            type: g.type,
            startDate: startStr,
            deadline: deadStr,
            targetHours: g.targetHours,
            priority: g.priority,
            status: g.status,
          });

          // Fetch chapters for the subject
          if (g.subjectId) {
            const chRes = await axiosClient.get(`/subjects/${g.subjectId._id || g.subjectId}/chapters`);
            if (chRes.data.success) {
              setChapters(chRes.data.data);
            }
          }
        }
      } catch (err) {
        showToast('Failed to load goal details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  // When subject changes, re-fetch chapters
  useEffect(() => {
    if (!selectedSubjectId || loading) return;
    const fetchChaps = async () => {
      try {
        const res = await axiosClient.get(`/subjects/${selectedSubjectId}/chapters`);
        if (res.data.success) {
          setChapters(res.data.data);
        }
      } catch (e) {
        setChapters([]);
      }
    };
    fetchChaps();
  }, [selectedSubjectId]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        chapterId: data.chapterId || null,
      };

      const res = await axiosClient.put(`/goals/${id}`, payload);
      if (res.data.success) {
        showToast('Study goal updated successfully!', 'success');
        navigate(`/goals/${id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          to={`/goals/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Goal Details</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Edit Study Goal
            </h1>
            <p className="text-xs text-slate-500">
              Update targets, deadlines, and completion criteria
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Goal Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Subject *
              </label>
              <select
                {...register('subjectId')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Related Chapter
              </label>
              <select
                {...register('chapterId')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">-- Whole Subject / None --</option>
                {chapters.map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                {...register('targetHours')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Deadline
              </label>
              <input
                type="date"
                {...register('deadline')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Goal Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to={`/goals/${id}`}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoalPage;
