import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import SubjectCard from '../components/cards/SubjectCard';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

const colorOptions = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
];

const categories = [
  'All',
  'Computer Science',
  'Artificial Intelligence',
  'Mathematics',
  'Engineering',
  'Sciences',
  'Business',
  'General',
];

const SubjectsPage = () => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Computer Science',
    color: '#6366f1',
    targetDate: '',
    estimatedHours: 40,
    status: 'Not Started',
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'All') params.append('status', status);
      if (category !== 'All') params.append('category', category);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await axiosClient.get(`/subjects?${params.toString()}`);
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, category, sortBy, sortOrder]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'Computer Science',
      color: '#6366f1',
      targetDate: '',
      estimatedHours: 40,
      status: 'Not Started',
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Subject name is required', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      const res = await axiosClient.post('/subjects', {
        ...formData,
        targetDate: formData.targetDate || null,
        estimatedHours: Number(formData.estimatedHours) || 0,
      });

      if (res.data.success) {
        showToast('Subject created successfully!', 'success');
        setCreateModalOpen(false);
        fetchSubjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create subject', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEdit = (subject) => {
    setActiveSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      description: subject.description || '',
      category: subject.category || 'Computer Science',
      color: subject.color || '#6366f1',
      targetDate: subject.targetDate ? subject.targetDate.split('T')[0] : '',
      estimatedHours: subject.estimatedHours || 0,
      status: subject.status || 'Not Started',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Subject name is required', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      const res = await axiosClient.put(`/subjects/${activeSubject._id}`, {
        ...formData,
        targetDate: formData.targetDate || null,
        estimatedHours: Number(formData.estimatedHours) || 0,
      });

      if (res.data.success) {
        showToast('Subject updated successfully!', 'success');
        setEditModalOpen(false);
        fetchSubjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update subject', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeSubject) return;
    setFormLoading(true);
    try {
      await axiosClient.delete(`/subjects/${activeSubject._id}`);
      showToast('Subject and all associated data deleted successfully.', 'success');
      setDeleteDialogOpen(false);
      fetchSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete subject', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Academic Subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your courses, organize chapters, and track syllabus completion
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by subject name or code (e.g., DBMS, CS201)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter by Status */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          {/* Filter by Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="progress:desc">Highest Progress</option>
            <option value="progress:asc">Lowest Progress</option>
            <option value="targetDate:asc">Target Date</option>
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No Subjects Found"
          description={
            search || status !== 'All'
              ? 'No subjects matched your search or filter criteria. Try resetting the filters.'
              : 'You have not created any academic subjects yet. Add your first subject to start tracking syllabus progress!'
          }
          actionText={search || status !== 'All' ? 'Clear Filters' : '+ Add New Subject'}
          onAction={() => {
            if (search || status !== 'All') {
              setSearch('');
              setStatus('All');
              setCategory('All');
            } else {
              handleOpenCreate();
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject._id}
              subject={subject}
              onEdit={() => handleOpenEdit(subject)}
              onDelete={() => {
                setActiveSubject(subject);
                setDeleteDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Create Subject Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Academic Subject"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Database Management Systems"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Subject Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CS301"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Key concepts, goals, and syllabus highlights..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Color theme selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Subject Color Theme
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: hex })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    formData.color === hex ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Estimated Total Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Target Completion Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${activeSubject?.name}"?`}
        message="This will permanently delete this subject and all of its chapters, topics, study goals, and logged study sessions. This action cannot be undone."
        confirmText="Delete Subject"
        isLoading={formLoading}
      />
    </div>
  );
};

export default SubjectsPage;
