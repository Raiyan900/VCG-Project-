import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import DashboardPage from './pages/DashboardPage';
import DatasetsPage from './pages/DatasetsPage';
import DiscoverPage from './pages/DiscoverPage';
import UploadPage from './pages/UploadPage';
import DatasetDetailsPage from './pages/DatasetDetailsPage';
import ValidationPage from './pages/ValidationPage';
import VersionsPage from './pages/VersionsPage';
import ArchivePage from './pages/ArchivePage';
import RetiredPage from './pages/RetiredPage';
import SharedPage from './pages/SharedPage';
import TeamPage from './pages/TeamPage';
import StoragePage from './pages/StoragePage';
import DuplicatesPage from './pages/DuplicatesPage';
import AIToolsPage from './pages/AIToolsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
      <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="datasets/:id" element={<DatasetDetailsPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="validation" element={<ValidationPage />} />
          <Route path="versions" element={<VersionsPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="retired" element={<RetiredPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="duplicates" element={<DuplicatesPage />} />
          <Route path="ai-tools" element={<AIToolsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
    </Routes>
  );
}
