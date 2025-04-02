
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

type RouteGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
};

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Can add analytics or logging here
  }, [location]);

  if (isLoading) {
    // Show a loading spinner or skeleton while checking auth status
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Redirect to login if authentication is required but user is not logged in
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (!requireAuth && user) {
    // Redirect to home page if user is already logged in and tries to access a public-only route
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
