import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AppRouter } from './components/AppRouter';
import { MaintenanceNotice } from './components/MaintenanceNotice';

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRouter />
        <MaintenanceNotice />
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
// w1
