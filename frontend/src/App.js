import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import UserLayout from './components/UserLayout';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import MyComplaintsPage from './pages/MyComplaintsPage';
import AllComplaints from './pages/admin/AllComplaints';
import RiskMonitor from './pages/admin/RiskMonitor';
import TrendAnalysis from './pages/admin/TrendAnalysis';
import SLAMonitor from './pages/admin/SLAMonitor';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Protected Routes */}
          <Route element={<PrivateRoute requiredRole="ADMIN"><AdminLayout /></PrivateRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<AllComplaints />} />
            <Route path="/admin/risk" element={<RiskMonitor />} />
            <Route path="/admin/trends" element={<TrendAnalysis />} />
            <Route path="/admin/sla" element={<SLAMonitor />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          {/* User Protected Routes */}
          <Route element={<PrivateRoute requiredRole="USER"><UserLayout /></PrivateRoute>}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/submit" element={<Dashboard />} />
            <Route path="/user/complaints" element={<MyComplaintsPage />} />
            <Route path="/user/track" element={<MyComplaintsPage />} /> {/* Using same as complaints for now */}
            <Route path="/user/profile" element={<UserDashboard />} /> {/* Placeholder */}
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
