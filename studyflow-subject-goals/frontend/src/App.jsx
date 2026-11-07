import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';
import SubjectDetailsPage from './pages/SubjectDetailsPage';
import ChapterDetailsPage from './pages/ChapterDetailsPage';
import GoalsPage from './pages/GoalsPage';
import CreateGoalPage from './pages/CreateGoalPage';
import EditGoalPage from './pages/EditGoalPage';
import GoalDetailsPage from './pages/GoalDetailsPage';
import StudyHistoryPage from './pages/StudyHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Protected Student Workspace Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/subjects/:id" element={<SubjectDetailsPage />} />
              <Route
                path="/subjects/:subjectId/chapters/:chapterId"
                element={<ChapterDetailsPage />}
              />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/goals/new" element={<CreateGoalPage />} />
              <Route path="/goals/:id/edit" element={<EditGoalPage />} />
              <Route path="/goals/:id" element={<GoalDetailsPage />} />
              <Route path="/study-history" element={<StudyHistoryPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
