import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { UploadPage } from './pages/UploadPage.js';
import { MyVideosPage } from './pages/MyVideosPage.js';
import { MyClipsPage } from './pages/MyClipsPage.js';
import { EditorPage } from './pages/EditorPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { useAuth } from './context/AuthContext.js';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Authenticating...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard Sub-routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/videos" element={<MyVideosPage />} />
        <Route path="/clips" element={<MyClipsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Full-screen Studio Editor Route */}
      <Route
        path="/editor/:clipId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
