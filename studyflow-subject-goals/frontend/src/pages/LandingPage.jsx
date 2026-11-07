import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Target,
  Clock,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight">
            StudyFlow <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-8">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Academic Productivity</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-tight mb-6">
          Master Your Subjects. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
            Crush Your Study Goals.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          The intelligent subject and study goals management system built for ambitious students. Organize chapters, track topic completion, and log real study hours effortlessly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2"
          >
            <span>Start Managing Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-base transition-all"
          >
            Try Demo Account
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-28">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Designed for Academic Excellence
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Everything you need to stay organized, disciplined, and ahead of your exam schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 hover:border-slate-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Deep Hierarchical Subjects
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Structure subjects into chapters and fine-grained topics. Set estimated study minutes, difficulty levels, and notes for every concept.
            </p>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Automatic chapter & subject progress</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Color-coded subjects and categories</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 hover:border-slate-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Multi-Tier Study Goals
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Create daily, weekly, monthly, and exam preparation goals. Set realistic target hours and priority deadlines to keep yourself on track.
            </p>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Overdue detection & remaining days</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Link goals directly to specific chapters</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 hover:border-slate-600 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Verified Real-Time Analytics
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Log actual study sessions with duration in minutes and accomplishment notes. Watch your progress charts update dynamically.
            </p>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Daily & weekly study hour charts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Strict non-negative duration validation</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 StudyFlow AI. Subject & Study Goals Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
