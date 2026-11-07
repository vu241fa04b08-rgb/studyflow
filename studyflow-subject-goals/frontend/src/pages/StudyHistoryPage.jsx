import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  History,
  Clock,
  Calendar,
  BookOpen,
  Target,
  Trash2,
  Edit2,
  Filter,
  PlusCircle,
  FileText,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';

const StudyHistoryPage = () => {
  const { showToast } = useToast();
  const { openLogModal } = useOutletContext();

  const [entries, setEntries] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Entry Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    durationMinutes: 60,
    date: '',
    notes: '',
  });

  // Delete Dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    entry: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await axiosClient.get('/subjects?limit=50');
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {}
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubject !== 'All') params.append('subjectId', selectedSubject);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '50');

      const res = await axiosClient.get(`/study-entries?${params.toString()}`);
      if (res.data.success) {
        setEntries(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load study history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchEntries();

    const handleLogged = () => {
      fetchEntries();
    };
    window.addEventListener('studyflow:sessionLogged', handleLogged);
    return () => window.removeEventListener('studyflow:sessionLogged', handleLogged);
  }, [selectedSubject, startDate, endDate]);

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      durationMinutes: entry.durationMinutes,
      date: entry.date ? entry.date.split('T')[0] : '',
      notes: entry.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const mins = parseInt(editForm.durationMinutes, 10);
    if (!mins || mins <= 0) {
      showToast('Duration must be greater than 0 minutes', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.put(`/study-entries/${editingEntry._id}`, {
        ...editForm,
        durationMinutes: mins,
      });
      showToast('Study session updated and progress recalculated!', 'success');
      setEditModalOpen(false);
      fetchEntries();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteConfirm.entry) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/study-entries/${deleteConfirm.entry._id}`);
      showToast('Study session deleted and metrics recalculated', 'success');
      setDeleteConfirm({ isOpen: false, entry: null });
      fetchEntries();
    } catch (err) {
      showToast('Failed to delete entry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
  const totalHours = +(totalMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Study History & Activity Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete audit trail of all focused learning sessions and time entries
          </p>
        </div>

        <button
          onClick={() => openLogModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Study Session</span>
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Sessions
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {entries.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Hours Logged
          </p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">
            {totalHours} hrs
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg Session Length
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0} mins
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="min-w-[140px]">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {(selectedSubject !== 'All' || startDate || endDate) && (
          <div className="self-end pb-0.5">
            <button
              onClick={() => {
                setSelectedSubject('All');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline px-2 py-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* History Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Study Sessions Recorded"
          description={
            selectedSubject !== 'All' || startDate || endDate
              ? 'No sessions matched your date or subject filter.'
              : 'You have not recorded any study activity yet. Log your first session!'
          }
          actionText="+ Log Study Time"
          onAction={() => openLogModal()}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Linked Goal / Topic</th>
                  <th className="py-3.5 px-5">Duration</th>
                  <th className="py-3.5 px-5">Notes</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-medium text-slate-700 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: entry.subjectId?.color || '#6366f1',
                          }}
                        />
                        <span className="font-bold text-slate-800">
                          {entry.subjectId?.name || 'General Subject'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      {entry.goalId && (
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px] mr-1.5 mb-1">
                          Goal: {entry.goalId.title}
                        </span>
                      )}
                      {entry.topicId && (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          Topic: {entry.topicId.title}
                        </span>
                      )}
                      {!entry.goalId && !entry.topicId && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-lg">
                        {entry.durationMinutes} mins ({(entry.durationMinutes / 60).toFixed(1)}h)
                      </span>
                    </td>
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-slate-600 text-xs italic line-clamp-2">
                        {entry.notes ? `"${entry.notes}"` : '—'}
                      </p>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit Session"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              entry,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Study Session"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Duration (Minutes) *
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              required
              value={editForm.durationMinutes}
              onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Session Date *
            </label>
            <input
              type="date"
              required
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Session'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Entry Confirm */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, entry: null })}
        onConfirm={handleDeleteSubmit}
        title="Delete this study session?"
        message="Deleting this session will remove its duration from goal and subject progress calculations."
        confirmText="Delete"
        isLoading={submitting}
      />
    </div>
  );
};

export default StudyHistoryPage;
