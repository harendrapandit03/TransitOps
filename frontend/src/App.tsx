import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext';
import { RouteGuard } from './components/RouteGuard';
import { DashboardLayout } from './components/DashboardLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehicleRegistryPage } from './pages/VehicleRegistryPage';
import { DriverManagementPage } from './pages/DriverManagementPage';
import { TripManagementPage } from './pages/TripManagementPage';
import { MaintenanceLogPage } from './pages/MaintenanceLogPage';
import { FuelExpensePage } from './pages/FuelExpensePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<AuthPage />} />

            {/* Secure App Layout Routes */}
            <Route
              path="/"
              element={
                <RouteGuard>
                  <DashboardLayout />
                </RouteGuard>
              }
            >
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="fleet" element={<VehicleRegistryPage />} />
              <Route path="drivers" element={<DriverManagementPage />} />
              <Route path="trips" element={<TripManagementPage />} />
              <Route path="maintenance" element={<MaintenanceLogPage />} />
              <Route path="expenses" element={<FuelExpensePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
