import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import UserLayout from './components/UserLayout';
import AdminLayout from './components/AdminLayout';
import SubmitComplaint from './pages/user/SubmitComplaint';
import MyComplaintsPage from './pages/MyComplaintsPage';

import AllComplaints from './pages/admin/AllComplaints';
import SLAMonitor from './pages/admin/SLAMonitor';
import Settings from './pages/admin/Settings';
import { ToastProvider } from './context/ToastContext';
import './App.css';

function App() {
  return (
    <ToastProvider>
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
            <Route path="/admin/sla" element={<SLAMonitor />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          {/* User Protected Routes */}
          <Route element={<PrivateRoute requiredRole="USER"><UserLayout /></PrivateRoute>}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/submit" element={<SubmitComplaint />} />
            <Route path="/user/complaints" element={<MyComplaintsPage />} />

          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
