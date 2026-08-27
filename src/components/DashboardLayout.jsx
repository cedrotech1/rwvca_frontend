import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPath } from '../utils/rwvcaAccess';
import { needsProfileCompletion } from '../utils/profileCompleteness';
import { AccessDenied } from '../pages/AccessDenied';
import { Navigate } from 'react-router-dom';

const SIDEBAR_COLLAPSED_KEY = 'rwvca-sidebar-collapsed';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      // ignore storage errors
    }
  }, [sidebarCollapsed]);

  const handleMenuClick = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarCollapsed((prev) => !prev);
      return;
    }
    setSidebarOpen((prev) => !prev);
  };

  const sidebarWidth = sidebarCollapsed ? 'lg:w-[4.5rem]' : 'lg:w-64';
  const mainOffset = sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64';

  const pendingProfile = needsProfileCompletion(user);
  const path = location.pathname.replace(/\/$/, '') || '/dashboard';
  const onProfilePage = path === '/dashboard/profile' || path.startsWith('/dashboard/profile/');

  if (pendingProfile && !onProfilePage) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`
          print:hidden
          fixed inset-y-0 left-0 z-50 w-64 bg-white
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40
          ${sidebarWidth}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${mainOffset}`}>
        <div className={`print:hidden fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${mainOffset}`}>
          <Header
            onMenuClick={handleMenuClick}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-150 p-4 lg:p-6 mt-16">
          {canAccessPath(user?.role, location.pathname, user) || (pendingProfile && onProfilePage)
            ? <Outlet />
            : <AccessDenied />}
        </main>
      </div>
    </div>
  );
};
