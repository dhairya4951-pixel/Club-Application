import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import PageLayout from './components/layout/PageLayout';
import Loading from './components/common/Loading';

// Core pages (loaded directly for fast initial paint)
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/home/HomePage';

// Route-level code splitting for secondary & admin pages
const ActivitiesPage = lazy(() => import('./pages/activities/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('./pages/activities/ActivityDetailPage'));
const MembersPage = lazy(() => import('./pages/members/MembersPage'));
const DiscussionPage = lazy(() => import('./pages/discussion/DiscussionPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const MyAttendancePage = lazy(() => import('./pages/attendance/MyAttendancePage'));
const MyEngagementPage = lazy(() => import('./pages/engagement/MyEngagementPage'));
const MemberEngagementPage = lazy(() => import('./pages/engagement/MemberEngagementPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageMembers = lazy(() => import('./pages/admin/ManageMembers'));
const ManageActivities = lazy(() => import('./pages/admin/ManageActivities'));
const ManageAttendance = lazy(() => import('./pages/admin/ManageAttendance'));
const ActivityAttendancePage = lazy(() => import('./pages/admin/ActivityAttendancePage'));
const ManageDiscussion = lazy(() => import('./pages/admin/ManageDiscussion'));
const ManageEngagement = lazy(() => import('./pages/admin/ManageEngagement'));

import './App.css';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* Member Routes */}
      <Route path="/" element={
        <ProtectedRoute><PageLayout><HomePage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/activities" element={
        <ProtectedRoute><PageLayout><ActivitiesPage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/activities/:id" element={
        <ProtectedRoute><PageLayout><ActivityDetailPage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/members" element={
        <ProtectedRoute><PageLayout><MembersPage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/discussion" element={
        <ProtectedRoute><PageLayout><DiscussionPage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/my-activities" element={
        <ProtectedRoute><PageLayout><MyAttendancePage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><PageLayout><ProfilePage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/my-engagement" element={
        <ProtectedRoute><PageLayout><MyEngagementPage /></PageLayout></ProtectedRoute>
      } />
      <Route path="/engagement/:memberId" element={
        <ProtectedRoute><PageLayout><MemberEngagementPage /></PageLayout></ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute><PageLayout><AdminDashboard /></PageLayout></AdminRoute>
      } />
      <Route path="/admin/members" element={
        <AdminRoute><PageLayout><ManageMembers /></PageLayout></AdminRoute>
      } />
      <Route path="/admin/activities" element={
        <AdminRoute><PageLayout><ManageActivities /></PageLayout></AdminRoute>
      } />
      <Route path="/admin/attendance" element={
        <AdminRoute><PageLayout><ManageAttendance /></PageLayout></AdminRoute>
      } />
      <Route path="/admin/attendance/:activityId" element={
        <AdminRoute><PageLayout><ActivityAttendancePage /></PageLayout></AdminRoute>
      } />
      <Route path="/admin/discussion" element={
        <AdminRoute><PageLayout><ManageDiscussion /></PageLayout></AdminRoute>
      } />
      <Route path="/admin/engagement" element={
        <AdminRoute><PageLayout><ManageEngagement /></PageLayout></AdminRoute>
      } />

      {/* Route Aliases */}
      <Route path="/attendance" element={<Navigate to="/my-activities" replace />} />
      <Route path="/engagement" element={<Navigate to="/my-engagement" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading fullPage message="Loading..." />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
