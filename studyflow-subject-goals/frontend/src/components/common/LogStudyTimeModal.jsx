import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { Clock, BookOpen, Target, Calendar, AlignLeft, CheckCircle2 } from 'lucide-react';

const LogStudyTimeModal = ({
  isOpen,
  onClose,
  initialSubjectId = '',
  initialGoalId = '',
  initialTopicId = '',
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [topics, setTopics] = useState([]);

  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [goalId, setGoalId] = useState(initialGoalId);
  const [topicId, setTopicId] = useState(initialTopicId);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setSubjectId(initialSubjectId || '');
      setGoalId(initialGoalId || '');
      setTopicId(initialTopicId || '');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      fetchSubjects();
    }
  }, [isOpen, initialSubjectId, initialGoalId, initialTopicId]);

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const res = await axiosClient.get('/subjects?limit=50');
      if (res.data.success) {
        setSubjects(res.data.data);
        if (!subjectId && res.data.data.length > 0) {
          setSubjectId(res.data.data[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch goals and topics when subjectId changes
  useEffect(() => {
    if (!subjectId) return;

    const fetchRelated = async () => {
      try {
        const [goalsRes, subjRes] = await Promise.all([
          axiosClient.get(`/goals?subjectId=${subjectId}&limit=50`),
          axiosClient.get(`/subjects/${subjectId}`),
        ]);

        if (goalsRes.data.success) {
          setGoals(goalsRes.data.data);
        }

        if (subjRes.data.success && subjRes.data.data.chapters) {
          // Flatten topics across chapters
          const allTopics = [];
          for (const ch of subjRes.data.data.chapters) {
            try {
              const topRes = await axiosClient.get(`/chapters/${ch._id}/topics`);
              if (topRes.data.success) {
                allTopics.push(...topRes.data.data);
              }
            } catch (err) {}
          }
          setTopics(allTopics);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRelated();
  }, [subjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      showToast('Please select a subject', 'warning');
      return;
    }
    const mins = parseInt(durationMinutes, 10);
    if (!mins || mins <= 0) {
      showToast('Duration must be greater than 0 minutes', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        subjectId,
        goalId: goalId || null,
        topicId: topicId || null,
        durationMinutes: mins,
        date: new Date(date).toISOString(),
        notes: notes.trim(),
      };

      const res = await axiosClient.post('/study-entries', payload);
      if (res.data.success) {
        showToast('Study session recorded successfully!', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to record study session';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Study Session" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Subject *
          </label>
          <div className="relative">
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setGoalId('');
                setTopicId('');
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            >
              <option value="" disabled>Select Subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Goal Selection (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Link to Study Goal (Optional)
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">-- No specific goal --</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title} ({g.actualHours}/{g.targetHours}h)
              </option>
            ))}
          </select>
        </div>

        {/* Topic Selection (Optional) */}
        {topics.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Link to Topic (Optional)
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="">-- No specific topic --</option>
              {topics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} [{t.status}]
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Duration & Date Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Duration (Minutes) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="1440"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. 60"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                {(durationMinutes / 60).toFixed(1)} hrs
              </span>
            </div>
            {/* Quick minute pills */}
            <div className="flex gap-1.5 mt-2">
              {[30, 45, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                    +durationMinutes === m
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Study Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Session Notes / What did you accomplish?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Reviewed chapter notes, solved 5 practice problems, completed quiz..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Recording...' : 'Log Study Time'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LogStudyTimeModal;
