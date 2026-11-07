import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import ProgressBar from '../components/common/ProgressBar';
import { StatusBadge, DifficultyBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatDate, formatTimeMinutes } from '../utils/formatters';

const SubjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openLogModal } = useOutletContext();

  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded accordion state for chapters
  const [expandedChapters, setExpandedChapters] = useState({});

  // Chapter Modal state
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    targetDate: '',
  });

  // Topic Modal state
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    estimatedMinutes: 45,
    difficulty: 'Medium',
    status: 'Not Started',
    notes: '',
  });

  // Delete Dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '', // 'chapter' | 'topic' | 'subject'
    id: null,
    title: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      const [subjRes, chapRes] = await Promise.all([
        axiosClient.get(`/subjects/${id}`),
        axiosClient.get(`/subjects/${id}/chapters`),
      ]);

      if (subjRes.data.success) {
        setSubject(subjRes.data.data);
      }
      if (chapRes.data.success) {
        setChapters(chapRes.data.data);
        // Default expand all chapters
        const exp = {};
        chapRes.data.data.forEach((ch) => {
          exp[ch._id] = true;
        });
        setExpandedChapters(exp);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load subject details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectData();
  }, [id]);

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Chapter CRUD
  const handleOpenCreateChapter = () => {
    setEditingChapter(null);
    setChapterForm({ title: '', description: '', targetDate: '' });
    setChapterModalOpen(true);
  };

  const handleOpenEditChapter = (chap) => {
    setEditingChapter(chap);
    setChapterForm({
      title: chap.title,
      description: chap.description || '',
      targetDate: chap.targetDate ? chap.targetDate.split('T')[0] : '',
    });
    setChapterModalOpen(true);
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) {
      showToast('Chapter title is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingChapter) {
        await axiosClient.put(`/chapters/${editingChapter._id}`, chapterForm);
        showToast('Chapter updated successfully', 'success');
      } else {
        await axiosClient.post(`/subjects/${id}/chapters`, chapterForm);
        showToast('Chapter created successfully', 'success');
      }
      setChapterModalOpen(false);
      fetchSubjectData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving chapter', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Topic CRUD
  const handleOpenCreateTopic = (chapterId) => {
    setSelectedChapterId(chapterId);
    setEditingTopic(null);
    setTopicForm({
      title: '',
      description: '',
      estimatedMinutes: 45,
      difficulty: 'Medium',
      status: 'Not Started',
      notes: '',
    });
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (topic) => {
    setEditingTopic(topic);
    setSelectedChapterId(topic.chapterId);
    setTopicForm({
      title: topic.title,
      description: topic.description || '',
      estimatedMinutes: topic.estimatedMinutes || 45,
      difficulty: topic.difficulty || 'Medium',
      status: topic.status || 'Not Started',
      notes: topic.notes || '',
    });
    setTopicModalOpen(true);
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicForm.title.trim()) {
      showToast('Topic title is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTopic) {
        await axiosClient.put(`/topics/${editingTopic._id}`, topicForm);
        showToast('Topic updated successfully', 'success');
      } else {
        await axiosClient.post(`/chapters/${selectedChapterId}/topics`, topicForm);
        showToast('Topic added to chapter!', 'success');
      }
      setTopicModalOpen(false);
      fetchSubjectData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving topic', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick toggle topic status
  const handleToggleTopicStatus = async (topic) => {
    const nextStatus =
      topic.status === 'Completed'
        ? 'Not Started'
        : topic.status === 'In Progress'
        ? 'Completed'
        : 'In Progress';

    try {
      await axiosClient.patch(`/topics/${topic._id}/status`, {
        status: nextStatus,
      });
      showToast(`Topic marked as ${nextStatus}`, 'info');
      fetchSubjectData();
    } catch (err) {
      showToast('Failed to update topic status', 'error');
    }
  };

  // Deletion
  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      if (deleteConfirm.type === 'chapter') {
        await axiosClient.delete(`/chapters/${deleteConfirm.id}`);
        showToast('Chapter and associated topics deleted', 'success');
      } else if (deleteConfirm.type === 'topic') {
        await axiosClient.delete(`/topics/${deleteConfirm.id}`);
        showToast('Topic deleted', 'success');
      }
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '' });
      fetchSubjectData();
    } catch (err) {
      showToast('Deletion failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-28" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!subject) {
    return (
      <EmptyState
        title="Subject Not Found"
        description="The subject you are looking for does not exist or has been removed."
        actionText="Back to Subjects"
        onAction={() => navigate('/subjects')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/subjects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Subjects</span>
        </Link>
      </div>

      {/* Subject Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: subject.color }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {subject.code && (
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase rounded-md bg-slate-100 text-slate-700">
                  {subject.code}
                </span>
              )}
              <span className="text-xs font-bold text-slate-400">
                {subject.category}
              </span>
              <StatusBadge status={subject.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {subject.name}
            </h1>

            {subject.description && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {subject.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>{subject.totalChapters} Chapters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>
                  {subject.completedTopics}/{subject.totalTopics} Topics Completed
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {subject.completedStudyHours}h / {subject.estimatedHours || 0}h Logged
                </span>
              </div>
              {subject.targetDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Target: {formatDate(subject.targetDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Box & Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-8 min-w-[240px]">
            <div className="w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1">
                <span>Subject Syllabus Progress</span>
                <span className="text-indigo-600 text-sm font-extrabold">
                  {subject.status === 'Completed' ? 100 : subject.progressPercentage}%
                </span>
              </div>
              <ProgressBar
                progress={subject.status === 'Completed' ? 100 : subject.progressPercentage}
                color={subject.color}
                showLabel={false}
                height="h-2.5"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full">
              <button
                onClick={() => openLogModal({ subjectId: subject._id })}
                className="flex-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Log Study Time</span>
              </button>
              <button
                onClick={handleOpenCreateChapter}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Chapter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters & Topics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Syllabus Chapters ({chapters.length})
            </h2>
            <p className="text-xs text-slate-500">
              Click topics to toggle status (Not Started → In Progress → Completed)
            </p>
          </div>
          <button
            onClick={handleOpenCreateChapter}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>
        </div>

        {chapters.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Chapters Added Yet"
            description="Start building your syllabus by adding Unit 1 or Chapter 1 for this subject."
            actionText="+ Add Chapter 1"
            onAction={handleOpenCreateChapter}
          />
        ) : (
          <div className="space-y-4">
            {chapters.map((chap, idx) => {
              const isExpanded = !!expandedChapters[chap._id];
              const chapTopics = chap.topics || [];

              return (
                <div
                  key={chap._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  {/* Chapter Header */}
                  <div
                    onClick={() => toggleChapter(chap._id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-800 truncate">
                            {chap.title}
                          </h3>
                          <StatusBadge status={chap.status} />
                        </div>
                        {chap.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {chap.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Chapter Progress pill */}
                      <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>
                          {chap.completedTopics}/{chap.totalTopics} topics ({chap.progressPercentage}%)
                        </span>
                        <div className="w-16">
                          <ProgressBar
                            progress={chap.progressPercentage}
                            color={subject.color}
                            showLabel={false}
                            height="h-1.5"
                          />
                        </div>
                      </div>

                      {/* Add Topic button */}
                      <button
                        onClick={() => handleOpenCreateTopic(chap._id)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Topic</span>
                      </button>

                      {/* Chapter Actions */}
                      <button
                        onClick={() => handleOpenEditChapter(chap)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit Chapter"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            type: 'chapter',
                            id: chap._id,
                            title: `Delete Chapter "${chap.title}"?`,
                          })
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Topics List Inside Chapter */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2">
                      {chapTopics.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No topics added to this chapter yet.{' '}
                          <button
                            onClick={() => handleOpenCreateTopic(chap._id)}
                            className="font-bold text-indigo-600 hover:underline ml-1"
                          >
                            + Add first topic
                          </button>
                        </div>
                      ) : (
                        chapTopics.map((topic) => {
                          const isCompleted = topic.status === 'Completed';
                          const isInProgress = topic.status === 'In Progress';

                          return (
                            <div
                              key={topic._id}
                              className="group bg-white rounded-xl p-3.5 border border-slate-200/70 hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 transition-all"
                            >
                              {/* Left: Status Toggle & Info */}
                              <div className="flex items-start gap-3 min-w-0">
                                <button
                                  onClick={() => handleToggleTopicStatus(topic)}
                                  className="mt-0.5 text-slate-300 hover:text-indigo-600 transition-colors flex-shrink-0"
                                  title={`Status: ${topic.status} (Click to toggle)`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : isInProgress ? (
                                    <PlayCircle className="w-5 h-5 text-blue-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                                  )}
                                </button>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className={`text-sm font-semibold truncate ${
                                        isCompleted
                                          ? 'line-through text-slate-400'
                                          : 'text-slate-800'
                                      }`}
                                    >
                                      {topic.title}
                                    </h4>
                                    <DifficultyBadge difficulty={topic.difficulty} />
                                  </div>

                                  {topic.description && (
                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                      {topic.description}
                                    </p>
                                  )}

                                  {topic.notes && (
                                    <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                                      Notes: {topic.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right: Estimated vs Actual & Actions */}
                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                                <div className="flex items-center gap-1 font-medium text-slate-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {topic.actualMinutes > 0 ? `${topic.actualMinutes}m / ` : ''}
                                    {topic.estimatedMinutes}m
                                  </span>
                                </div>

                                <button
                                  onClick={() =>
                                    openLogModal({
                                      subjectId: subject._id,
                                      chapterId: chap._id,
                                      topicId: topic._id,
                                    })
                                  }
                                  className="text-xs font-semibold px-2 py-0.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Log time on this topic"
                                >
                                  + Log
                                </button>

                                <button
                                  onClick={() => handleOpenEditTopic(topic)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      isOpen: true,
                                      type: 'topic',
                                      id: topic._id,
                                      title: `Delete Topic "${topic.title}"?`,
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chapter Modal */}
      <Modal
        isOpen={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        title={editingChapter ? 'Edit Chapter' : 'Add Chapter to Subject'}
      >
        <form onSubmit={handleChapterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Chapter Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Relational Model & SQL Basics"
              value={chapterForm.title}
              onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description / Learning Goals
            </label>
            <textarea
              rows={2}
              placeholder="What topics does this chapter cover?"
              value={chapterForm.description}
              onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Target Completion Date
            </label>
            <input
              type="date"
              value={chapterForm.targetDate}
              onChange={(e) => setChapterForm({ ...chapterForm, targetDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setChapterModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Add Chapter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Topic Modal */}
      <Modal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        title={editingTopic ? 'Edit Topic' : 'Add New Topic'}
      >
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Topic Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Schema Architecture & Data Independence"
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
              placeholder="Concepts to understand, formulas, or practical exercises..."
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Estimated Time (Minutes)
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
                Difficulty Level
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Study Notes / Reference Links
            </label>
            <textarea
              rows={2}
              placeholder="Key textbook page numbers, important theorems, tips..."
              value={topicForm.notes}
              onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTopicModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTopic ? 'Update Topic' : 'Add Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: '', id: null, title: '' })}
        onConfirm={handleDeleteConfirm}
        title={deleteConfirm.title}
        message="This action will permanently delete this item and recalculate all related syllabus metrics."
        confirmText="Confirm Delete"
        isLoading={submitting}
      />
    </div>
  );
};

export default SubjectDetailsPage;
