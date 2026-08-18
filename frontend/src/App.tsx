import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import { PageLoader } from './components/common/LoadingSpinner'

const DashboardPage     = lazy(() => import('./pages/dashboard/DashboardPage'))
const ProjectsPage      = lazy(() => import('./pages/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'))
const ActivitiesPage    = lazy(() => import('./pages/activities/ActivitiesPage'))
const UsersPage         = lazy(() => import('./pages/users/UsersPage'))
const AuditPage         = lazy(() => import('./pages/audit/AuditPage'))

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
