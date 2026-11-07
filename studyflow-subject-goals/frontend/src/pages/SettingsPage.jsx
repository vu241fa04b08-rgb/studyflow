import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Clock,
  Download,
  Shield,
  Palette,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
  const { showToast } = useToast();
  const [defaultDuration, setDefaultDuration] = useState('60');
  const [defaultGoalType, setDefaultGoalType] = useState('Weekly goal');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [subjectsRes, goalsRes, historyRes] = await Promise.all([
        axiosClient.get('/subjects?limit=100'),
        axiosClient.get('/goals?limit=100'),
        axiosClient.get('/study-entries?limit=500'),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        subjects: subjectsRes.data.data,
        goals: goalsRes.data.data,
        studyEntries: historyRes.data.data,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `studyflow_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('StudyFlow data backup exported successfully!', 'success');
    } catch (err) {
      showToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('studyflow_default_duration', defaultDuration);
    localStorage.setItem('studyflow_default_goal_type', defaultGoalType);
    showToast('Preferences saved successfully', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure productivity preferences, study session defaults, and data backups
        </p>
      </div>

      <div className="space-y-6">
        {/* Study Preferences */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Study Session Defaults
            </h3>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Default Log Session Duration
              </label>
              <select
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="30">30 Minutes (Sprint session)</option>
                <option value="45">45 Minutes (Pomodoro + buffer)</option>
                <option value="60">60 Minutes (Standard 1 hour)</option>
                <option value="90">90 Minutes (Deep focus block)</option>
                <option value="120">120 Minutes (2 hours intensive)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Default Goal Horizon Type
              </label>
              <select
                value={defaultGoalType}
                onChange={(e) => setDefaultGoalType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Daily goal">Daily goal</option>
                <option value="Weekly goal">Weekly goal</option>
                <option value="Monthly goal">Monthly goal</option>
                <option value="Subject completion goal">Subject completion goal</option>
                <option value="Exam preparation goal">Exam preparation goal</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Data Backup & Export */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Data Portability & Backup
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed mb-6">
            Export a full JSON archive containing all your academic subjects, syllabus chapters, detailed topics, study goals, and verified study session history.
          </p>

          <button
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating JSON Backup...' : 'Export Full Data (JSON)'}</span>
          </button>
        </div>

        {/* Security & Access Protection Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Account Security & Isolation Guarantee
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Strict Data Isolation</strong>
                Your subjects, topics, and goals are strictly scoped to your private user ID. No other student can query, view, or modify your records.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Hashed Credentials & JWT Session</strong>
                Passwords are one-way hashed with bcrypt (salt factor 10) and sessions are authenticated via JWT cookies and Bearer headers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
