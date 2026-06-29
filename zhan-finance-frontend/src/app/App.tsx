import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from '@/pages/home/HomePage';
import { AboutPage } from '@/pages/about/AboutPage';
import { ServicesPage } from '@/pages/services/ServicesPage';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { RegisterPage } from '@/pages/auth/register/RegisterPage';
import { AuthProvider } from '@/features/auth/AuthContext';
import { NotificationProvider } from '@/features/notifications/NotificationContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/features/auth/RoleProtectedRoute';
import { DashboardLayout } from '@/widgets/dashboard-shell/DashboardLayout';
import { DashboardRedirect } from '@/pages/dashboard/DashboardRedirect';
import { NotificationsPage } from '@/pages/dashboard/shared/NotificationsPage';
import { SettingsPage } from '@/pages/dashboard/shared/settings/SettingsPage';
import { ScrollToTop } from '@/shared/ui/ScrollToTop';

// Admin
import { AdminOverviewPage } from '@/pages/dashboard/admin/AdminOverviewPage';
import { AdminEmployeesPage } from '@/pages/dashboard/admin/AdminEmployeesPage';
import { AdminClientsPage } from '@/pages/dashboard/admin/AdminClientsPage';
import { AdminTasksPage } from '@/pages/dashboard/admin/AdminTasksPage';
import { AdminArchiveDonePage } from '@/pages/dashboard/admin/AdminArchiveDonePage';
import { AdminArchiveCancelledPage } from '@/pages/dashboard/admin/AdminArchiveCancelledPage';
import { EmployeeChatPage } from '@/pages/dashboard/employee/EmployeeChatPage';
import { AdminCoursesPage } from '@/pages/dashboard/admin/AdminCoursesPage';
import { AdminCourseEditPage } from '@/pages/dashboard/admin/AdminCourseEditPage';
import { AdminLessonEditPage } from '@/pages/dashboard/admin/AdminLessonEditPage';
import { AdminLearnersPage } from '@/pages/dashboard/admin/AdminLearnersPage';

// Learner
import { LearnerCoursesPage } from '@/pages/dashboard/learner/LearnerCoursesPage';
import { LearnerCourseDetailPage } from '@/pages/dashboard/learner/LearnerCourseDetailPage';
import { LearnerLessonPage } from '@/pages/dashboard/learner/LearnerLessonPage';

// Employee
import { EmployeeOverviewPage } from '@/pages/dashboard/employee/EmployeeOverviewPage';
import { EmployeeClientsPage } from '@/pages/dashboard/employee/EmployeeClientsPage';
import { EmployeeTasksPage } from '@/pages/dashboard/employee/EmployeeTasksPage';
import { EmployeeDocumentsPage } from '@/pages/dashboard/employee/EmployeeDocumentsPage';

// Shared Task Details
import { TaskDetailsPage } from '@/pages/task-details/TaskDetailsPage';

// Client
import { ClientOverviewPage } from '@/pages/dashboard/client/ClientOverviewPage';
import { ClientDocumentsPage } from '@/pages/dashboard/client/ClientDocumentsPage';
import { ClientChatPage } from '@/pages/dashboard/client/ClientChatPage';
import { CompleteProfilePage } from '@/pages/auth/complete-profile/CompleteProfilePage';
import { CalendarPage } from '@/pages/dashboard/shared/calendar/CalendarPage';
import { GoogleOAuthProvider } from '@react-oauth/google';

export function App() {
  const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <GoogleOAuthProvider clientId="249161344734-j51fft6shbogf2clnrhofn3l0c1euihl.apps.googleusercontent.com">
      <AuthProvider>
        <NotificationProvider>
        <BrowserRouter basename={routerBasename}>
          <ScrollToTop />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.ABOUT} element={<AboutPage />} />
              <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
            </Route>

            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.COMPLETE_PROFILE} element={<CompleteProfilePage />} />

            {/* Dashboard Entry Point */}
            <Route path={ROUTES.PROFILE} element={<DashboardRedirect />} />

            {/* Dashboard Shell Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
              
                {/* Admin Routes */}
              <Route element={<RoleProtectedRoute allow={['ADMIN']} />}>
                <Route path={ROUTES.ADMIN} element={<AdminOverviewPage />} />
                <Route path={ROUTES.ADMIN_CHAT} element={<EmployeeChatPage />} />
                <Route path={ROUTES.ADMIN_EMPLOYEES} element={<AdminEmployeesPage />} />
                <Route path={ROUTES.ADMIN_CLIENTS} element={<AdminClientsPage />} />
                <Route path={ROUTES.ADMIN_TASKS} element={<AdminTasksPage />} />
                <Route path={ROUTES.ADMIN_ARCHIVE_DONE} element={<AdminArchiveDonePage />} />
                <Route path={ROUTES.ADMIN_ARCHIVE_CANCELLED} element={<AdminArchiveCancelledPage />} />
                <Route path={ROUTES.ADMIN_TASK_DETAILS} element={<TaskDetailsPage />} />
                <Route path={ROUTES.ADMIN_COURSES} element={<AdminCoursesPage />} />
                <Route path={ROUTES.ADMIN_COURSES_NEW} element={<AdminCourseEditPage />} />
                <Route path={ROUTES.ADMIN_COURSES_EDIT} element={<AdminCourseEditPage />} />
                <Route path={ROUTES.ADMIN_LESSON_EDIT} element={<AdminLessonEditPage />} />
                <Route path={ROUTES.ADMIN_LEARNERS} element={<AdminLearnersPage />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<RoleProtectedRoute allow={['EMPLOYEE']} />}>
                <Route path={ROUTES.EMPLOYEE} element={<EmployeeOverviewPage />} />
                <Route path={ROUTES.EMPLOYEE_CHAT} element={<EmployeeChatPage />} />
                <Route path={ROUTES.EMPLOYEE_CLIENTS} element={<EmployeeClientsPage />} />
                <Route path={ROUTES.EMPLOYEE_TASKS} element={<EmployeeTasksPage />} />
                <Route path={ROUTES.EMPLOYEE_TASK_DETAILS} element={<TaskDetailsPage />} />
                <Route path={ROUTES.EMPLOYEE_DOCUMENTS} element={<EmployeeDocumentsPage />} />
                <Route path={ROUTES.EMPLOYEE_CALENDAR} element={<CalendarPage />} />
              </Route>

              {/* Client Routes */}
              <Route element={<RoleProtectedRoute allow={['CLIENT']} />}>
                <Route path={ROUTES.CLIENT} element={<ClientOverviewPage />} />
                <Route path={ROUTES.CLIENT_CHAT} element={<ClientChatPage />} />
                <Route path={ROUTES.CLIENT_DOCUMENTS} element={<ClientDocumentsPage />} />
                <Route path={ROUTES.CLIENT_CALENDAR} element={<CalendarPage />} />
              </Route>

              {/* Learner Routes */}
              <Route element={<RoleProtectedRoute allow={['LEARNER']} />}>
                <Route path={ROUTES.LEARNER_COURSES} element={<LearnerCoursesPage />} />
                <Route path={ROUTES.LEARNER_COURSE_DETAILS} element={<LearnerCourseDetailPage />} />
                <Route path={ROUTES.LEARNER_LESSON} element={<LearnerLessonPage />} />
              </Route>
              
              {/* Shared Routes for non-learner authenticated users */}
              <Route element={<RoleProtectedRoute allow={['ADMIN', 'EMPLOYEE', 'CLIENT']} />}>
                <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
              </Route>
                
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}