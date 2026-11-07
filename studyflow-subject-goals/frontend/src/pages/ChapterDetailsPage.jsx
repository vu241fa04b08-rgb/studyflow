import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import ProgressBar from '../components/common/ProgressBar';
import { StatusBadge, DifficultyBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';

const ChapterDetailsPage = () => {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openLogModal } = useOutletContext();

  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Topic modal
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    estimatedMinutes: 45,
    difficulty: 'Medium',
    notes: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    title: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/chapters/${chapterId}`);
      if (res.data.success) {
        setChapter(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load chapter', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const handleOpenCreateTopic = () => {
    setEditingTopic(null);
    setTopicForm({
      title: '',
      description: '',
      estimatedMinutes: 45,
      difficulty: 'Medium',
      notes: '',
    });
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t) => {
    setEditingTopic(t);
    setTopicForm({
      title: t.title,
      description: t.description || '',
      estimatedMinutes: t.estimatedMinutes || 45,
      difficulty: t.difficulty || 'Medium',
      notes: t.notes || '',
    });
    setTopicModalOpen(true);
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicForm.title.trim()) {
      showToast('Title is required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTopic) {
        await axiosClient.put(`/topics/${editingTopic._id}`, topicForm);
        showToast('Topic updated', 'success');
      } else {
        await axiosClient.post(`/chapters/${chapterId}/topics`, topicForm);
        showToast('Topic created', 'success');
      }
      setTopicModalOpen(false);
      fetchChapter();
    } catch (err) {
      showToast('Failed to save topic', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTopic = async (topic) => {
    const nextStatus =
      topic.status === 'Completed'
        ? 'Not Started'
        : topic.status === 'In Progress'
        ? 'Completed'
        : 'In Progress';

    try {
      await axiosClient.patch(`/topics/${topic._id}/status`, { status: nextStatus });
      fetchChapter();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteTopic = async () => {
    setSubmitting(true);
    try {
      await axiosClient.delete(`/topics/${deleteConfirm.id}`);
      showToast('Topic deleted', 'success');
      setDeleteConfirm({ isOpen: false, id: null, title: '' });
      fetchChapter();
    } catch (err) {
      showToast('Failed to delete topic', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <EmptyState
        title="Chapter Not Found"
        description="The chapter requested does not exist."
        actionText="Back to Subject"
        onAction={() => navigate(`/subjects/${subjectId}`)}
      />
    );
  }

  const topics = chapter.topics || [];
  const subjectName = chapter.subjectId?.name || 'Subject';

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/subjects/${subjectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {subjectName}</span>
        </Link>
      </div>

      {/* Chapter Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {subjectName}
              </span>
              <StatusBadge status={chapter.status} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {chapter.title}
            </h1>
            {chapter.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                {chapter.description}
              </p>
            )}
          </div>

          <button
            onClick={handleOpenCreateTopic}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Topic</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>
              {chapter.completedTopics}/{chapter.totalTopics} Topics Completed
            </span>
            {chapter.targetDate && (
              <span>Deadline: {formatDate(chapter.targetDate)}</span>
            )}
          </div>
          <div className="w-full sm:w-60">
            <ProgressBar progress={chapter.status === 'Completed' ? 100 : chapter.progressPercentage} height="h-2" />
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">
          Topics in this Chapter
        </h2>

        {topics.length === 0 ? (
          <EmptyState
            title="No topics in this chapter"
            description="Add topics to break down this chapter and track completion."
            actionText="+ Add Topic"
            onAction={handleOpenCreateTopic}
          />
        ) : (
          <div className="space-y-2">
            {topics.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTopic(t)}
                    className="text-slate-300 hover:text-indigo-600 transition-colors flex-shrink-0"
                  >
                    {t.status === 'Completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : t.status === 'In Progress' ? (
                      <PlayCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          t.status === 'Completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-800'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <DifficultyBadge difficulty={t.difficulty} />
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                  <div className="flex items-center gap-1 font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t.estimatedMinutes}m</span>
                  </div>

                  <button
                    onClick={() =>
                      openLogModal({
                        subjectId,
                        chapterId,
                        topicId: t._id,
                      })
                    }
                    className="text-xs font-semibold px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    + Log Time
                  </button>

                  <button
                    onClick={() => handleOpenEditTopic(t)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        id: t._id,
                        title: `Delete "${t.title}"?`,
                      })
                    }
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        title={editingTopic ? 'Edit Topic' : 'Add Topic'}
      >
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Topic Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Subqueries and Nested Correlated Queries"
              value={topicForm.title}
              onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Topic Description
            </label>
            <textarea
              rows={2}
              placeholder="Overview and key points..."
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Estimated Minutes
              </label>
              <input
                type="number"
                min="0"
                value={topicForm.estimatedMinutes}
                onChange={(e) => setTopicForm({ ...topicForm, estimatedMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Difficulty
              </label>
              <select
                value={topicForm.difficulty}
                onChange={(e) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTopicModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTopic ? 'Update' : 'Add Topic'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={handleDeleteTopic}
        title={deleteConfirm.title}
        message="This will permanently delete this topic."
        isLoading={submitting}
      />
    </div>
  );
};

export default ChapterDetailsPage;
