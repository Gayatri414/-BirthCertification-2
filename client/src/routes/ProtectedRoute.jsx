import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ROLE_HOME } from '../utils/constants';

// <ProtectedRoute allowedRoles={["USER"]} /> wraps child routes via <Outlet />.
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}

// Keeps signed-in users away from login/register.
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
