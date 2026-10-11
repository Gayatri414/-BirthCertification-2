import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { GuestRoute } from './ProtectedRoute';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { ROLES } from '../utils/constants';

const Home = lazy(() => import('../pages/public/Home'));
const About = lazy(() => import('../pages/public/About'));
const HowItWorks = lazy(() => import('../pages/public/HowItWorks'));
const VerifyCertificate = lazy(() => import('../pages/public/VerifyCertificate'));
const TrackApplication = lazy(() => import('../pages/public/TrackApplication'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const VerifyOtp = lazy(() => import('../pages/auth/VerifyOtp'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const UserDashboard = lazy(() => import('../pages/user/Dashboard'));
const UserApplications = lazy(() => import('../pages/user/Applications'));
const UserApplicationDetail = lazy(() => import('../pages/user/ApplicationDetail'));
const UserProfile = lazy(() => import('../pages/user/Profile'));
const UserChangePassword = lazy(() => import('../pages/user/ChangePassword'));
const UserNotifications = lazy(() => import('../pages/shared/Notifications'));
const UserCertificates = lazy(() => import('../pages/user/Certificates'));
const HospitalDashboard = lazy(() => import('../pages/hospital/Dashboard'));
const HospitalRegistrations = lazy(() => import('../pages/hospital/Registrations'));
const NewRegistration = lazy(() => import('../pages/hospital/NewRegistration'));
const RegistrationDetail = lazy(() => import('../pages/hospital/RegistrationDetail'));
const HospitalProfile = lazy(() => import('../pages/hospital/Profile'));
const MunicipalDashboard = lazy(() => import('../pages/municipal/Dashboard'));
const MunicipalApplications = lazy(() => import('../pages/municipal/Applications'));
const MunicipalApproved = lazy(() => import('../pages/municipal/Approved'));
const MunicipalRejected = lazy(() => import('../pages/municipal/Rejected'));
const ApplicationReview = lazy(() => import('../pages/municipal/ApplicationReview'));
const MunicipalReports = lazy(() => import('../pages/municipal/Reports'));
const MunicipalAuditLogs = lazy(() => import('../pages/municipal/AuditLogs'));
const CorrectionPage = lazy(() => import('../pages/shared/CorrectionPage'));
const ComingSoon = lazy(() => import('../pages/ComingSoon'));
const NotFound = lazy(() => import('../pages/errors/NotFound'));
const Forbidden = lazy(() => import('../pages/errors/Forbidden'));
const ServerError = lazy(() => import('../pages/errors/ServerError'));

// Admin screens are built in a later phase; its guarded shell already works.
const roleShell = (path, role) => (
  <Route element={<ProtectedRoute allowedRoles={[role]} />}>
    <Route path={`/${path}`} element={<DashboardLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="*" element={<ComingSoon role={role} />} />
    </Route>
  </Route>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="verify-certificate" element={<VerifyCertificate />} />
          <Route path="verify/:certificateNumber" element={<VerifyCertificate />} />
          <Route path="track-application" element={<TrackApplication />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-otp" element={<VerifyOtp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.USER]} />}>
          <Route path="/user" element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="applications" element={<UserApplications />} />
            <Route path="application/:id" element={<UserApplicationDetail />} />
            <Route path="application/:id/edit" element={<CorrectionPage role="USER" detailPath={(id) => `/user/application/${id}`} />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="change-password" element={<UserChangePassword />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="certificates" element={<UserCertificates />} />
            <Route path="verify-certificate" element={<VerifyCertificate embedded />} />
            <Route path="*" element={<NotFound embedded />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={[ROLES.HOSPITAL]} />}>
          <Route path="/hospital" element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HospitalDashboard />} />
            <Route path="registrations" element={<HospitalRegistrations />} />
            <Route path="registrations/new" element={<NewRegistration />} />
            <Route path="registrations/:id" element={<RegistrationDetail />} />
            <Route path="registrations/:id/edit" element={<CorrectionPage role="HOSPITAL" detailPath={(id) => `/hospital/registrations/${id}`} />} />
            <Route path="profile" element={<HospitalProfile />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="*" element={<NotFound embedded />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={[ROLES.MUNICIPAL_OFFICER]} />}>
          <Route path="/municipal" element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MunicipalDashboard />} />
            <Route path="applications" element={<MunicipalApplications />} />
            <Route path="applications/:id" element={<ApplicationReview />} />
            <Route path="approved" element={<MunicipalApproved />} />
            <Route path="rejected" element={<MunicipalRejected />} />
            <Route path="reports" element={<MunicipalReports />} />
            <Route path="audit-logs" element={<MunicipalAuditLogs />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="*" element={<NotFound embedded />} />
          </Route>
        </Route>
        {roleShell('admin', ROLES.SUPER_ADMIN)}

        <Route path="/403" element={<Forbidden />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
