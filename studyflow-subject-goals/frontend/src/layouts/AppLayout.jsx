import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import LogStudyTimeModal from '../components/common/LogStudyTimeModal';
import { useAuth } from '../context/AuthContext';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logModalProps, setLogModalProps] = useState({});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Loading StudyFlow AI...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const openLogModal = (props = {}) => {
    setLogModalProps(props);
    setLogModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenLogModal={() => openLogModal()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          onOpenLogModal={() => openLogModal()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openLogModal }} />
        </main>
      </div>

      {/* Global Log Study Time Modal */}
      <LogStudyTimeModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        initialSubjectId={logModalProps.subjectId}
        initialGoalId={logModalProps.goalId}
        initialTopicId={logModalProps.topicId}
        onSuccess={() => {
          if (logModalProps.onSuccess) logModalProps.onSuccess();
          // Dispatch a custom event so active pages can refetch smoothly
          window.dispatchEvent(new Event('studyflow:sessionLogged'));
        }}
      />
    </div>
  );
};

export default AppLayout;
