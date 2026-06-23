import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from '@/pages/home/HomePage';
import { AboutPage } from '@/pages/about/AboutPage';
import { ServicesPage } from '@/pages/services/ServicesPage';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { RegisterPage } from '@/pages/auth/register/RegisterPage';
import { AuthProvider } from '@/features/auth/AuthContext';
import { RoleProtectedRoute } from '@/features/auth/RoleProtectedRoute';
import { DashboardLayout } from '@/widgets/dashboard-shell/DashboardLayout';
import { DashboardRedirect } from '@/pages/dashboard/DashboardRedirect';

// Admin
import { AdminOverviewPage } from '@/pages/dashboard/admin/AdminOverviewPage';
import { AdminEmployeesPage } from '@/pages/dashboard/admin/AdminEmployeesPage';
import { AdminClientsPage } from '@/pages/dashboard/admin/AdminClientsPage';
import { AdminTasksPage } from '@/pages/dashboard/admin/AdminTasksPage';
import { AdminArchiveDonePage } from '@/pages/dashboard/admin/AdminArchiveDonePage';
import { AdminArchiveCancelledPage } from '@/pages/dashboard/admin/AdminArchiveCancelledPage';

// Employee
import { EmployeeOverviewPage } from '@/pages/dashboard/employee/EmployeeOverviewPage';
import { EmployeeClientsPage } from '@/pages/dashboard/employee/EmployeeClientsPage';
import { EmployeeTasksPage } from '@/pages/dashboard/employee/EmployeeTasksPage';

// Shared Task Details
import { TaskDetailsPage } from '@/pages/task-details/TaskDetailsPage';

// Client
import { ClientOverviewPage } from '@/pages/dashboard/client/ClientOverviewPage';
import { ClientTasksPage } from '@/pages/dashboard/client/ClientTasksPage';
import { ClientDocumentsPage } from '@/pages/dashboard/client/ClientDocumentsPage';

export function App() {
  const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <AuthProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          </Route>

          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

          {/* Dashboard Entry Point */}
          <Route path={ROUTES.PROFILE} element={<DashboardRedirect />} />

          {/* Dashboard Shell Layout */}
          <Route element={<DashboardLayout />}>
            
            {/* Admin Routes */}
            <Route element={<RoleProtectedRoute allow={['ADMIN']} />}>
              <Route path={ROUTES.ADMIN} element={<AdminOverviewPage />} />
              <Route path={ROUTES.ADMIN_EMPLOYEES} element={<AdminEmployeesPage />} />
              <Route path={ROUTES.ADMIN_CLIENTS} element={<AdminClientsPage />} />
              <Route path={ROUTES.ADMIN_TASKS} element={<AdminTasksPage />} />
              <Route path={ROUTES.ADMIN_ARCHIVE_DONE} element={<AdminArchiveDonePage />} />
              <Route path={ROUTES.ADMIN_ARCHIVE_CANCELLED} element={<AdminArchiveCancelledPage />} />
              <Route path={ROUTES.ADMIN_TASK_DETAILS} element={<TaskDetailsPage />} />
            </Route>

            {/* Employee Routes */}
            <Route element={<RoleProtectedRoute allow={['EMPLOYEE']} />}>
              <Route path={ROUTES.EMPLOYEE} element={<EmployeeOverviewPage />} />
              <Route path={ROUTES.EMPLOYEE_CLIENTS} element={<EmployeeClientsPage />} />
              <Route path={ROUTES.EMPLOYEE_TASKS} element={<EmployeeTasksPage />} />
              <Route path={ROUTES.EMPLOYEE_TASK_DETAILS} element={<TaskDetailsPage />} />
            </Route>

            {/* Client Routes */}
            <Route element={<RoleProtectedRoute allow={['CLIENT']} />}>
              <Route path={ROUTES.CLIENT} element={<ClientOverviewPage />} />
              <Route path={ROUTES.CLIENT_TASKS} element={<ClientTasksPage />} />
              <Route path={ROUTES.CLIENT_DOCUMENTS} element={<ClientDocumentsPage />} />
            </Route>
            
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}