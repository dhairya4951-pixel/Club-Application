import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import PageLayout from './components/layout/PageLayout';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/home/HomePage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import MembersPage from './pages/members/MembersPage';
import DiscussionPage from './pages/discussion/DiscussionPage';
import ProfilePage from './pages/profile/ProfilePage';
import MyAttendancePage from './pages/attendance/MyAttendancePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageMembers from './pages/admin/ManageMembers';
import ManageActivities from './pages/admin/ManageActivities';
import ManageAttendance from './pages/admin/ManageAttendance';
import ActivityAttendancePage from './pages/admin/ActivityAttendancePage';
import ManageDiscussion from './pages/admin/ManageDiscussion';
import ManageEngagement from './pages/admin/ManageEngagement';
import MyEngagementPage from './pages/engagement/MyEngagementPage';
import MemberEngagementPage from './pages/engagement/MemberEngagementPage';
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

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
