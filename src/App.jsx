import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AppRouter } from './components/AppRouter';

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRouter />
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
// w1
