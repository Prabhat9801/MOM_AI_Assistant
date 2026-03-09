import { Routes, Route } from 'react-router-dom';
import { useThemeStore } from './store';
import { useEffect } from 'react';

import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import MeetingsPage from './pages/MeetingsPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import ScheduleMeetingPage from './pages/ScheduleMeetingPage';
import LogMOMPage from './pages/LogMOMPage';
import UploadMOMPage from './pages/UploadMOMPage';
import CreateMOMPage from './pages/CreateMOMPage';
import BoardResolutionsPage from './pages/BoardResolutionsPage';
import CreateBRPage from './pages/CreateBRPage';
import BRDetailPage from './pages/BRDetailPage';
import UploadBRPage from './pages/UploadBRPage';
import ScheduleBRPage from './pages/ScheduleBRPage';

import TasksPage from './pages/TasksPage';
import AttendancePage from './pages/AttendancePage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';

export default function App() {
  const dark = useThemeStore((s) => s.dark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/meetings/:id" element={<MeetingDetailPage />} />
              <Route path="/meetings/:id/log-mom" element={<LogMOMPage />} />
              <Route path="/schedule-meeting" element={<ScheduleMeetingPage />} />
              <Route path="/upload" element={<UploadMOMPage />} />
              <Route path="/create-mom" element={<CreateMOMPage />} />
              {/* Board Resolutions */}
              <Route path="/board-resolutions" element={<BoardResolutionsPage />} />
              <Route path="/create-br" element={<CreateBRPage />} />
              <Route path="/board-resolutions/:id" element={<BRDetailPage />} />
              <Route path="/upload-br" element={<UploadBRPage />} />
              <Route path="/schedule-br" element={<ScheduleBRPage />} />
              {/* Other */}
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
