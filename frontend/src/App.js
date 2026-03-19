import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import MyComplaintsPage from './pages/MyComplaintsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';

// CSS for Minimal Layout
const Navbar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (!token) return null;

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav style={{ padding: '15px', background: '#333', color: 'white', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>WaterQuality</span>
            {role === 'USER' ? (
                <>
                    <Link to="/" style={{ color: 'white' }}>New Complaint</Link>
                    <Link to="/my-complaints" style={{ color: 'white' }}>My Complaints</Link>
                    <Link to="/notifications" style={{ color: 'white' }}>Notifications</Link>
                </>
            ) : (
                <>
                    <Link to="/admin" style={{ color: 'white' }}>Admin Queue</Link>
                    <Link to="/notifications" style={{ color: 'white' }}>System Alerts</Link>
                </>
            )}
            <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Logout</button>
        </nav>
    );
};

const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;
    if (role && userRole !== role) return <Navigate to="/" />;

    return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User Routes */}
        <Route path="/" element={
            <ProtectedRoute role="USER">
                <UserDashboard />
            </ProtectedRoute>
        } />
        <Route path="/my-complaints" element={
            <ProtectedRoute role="USER">
                <MyComplaintsPage />
            </ProtectedRoute>
        } />

        {/* Notifications (Both see different data based on role) */}
        <Route path="/notifications" element={
            <ProtectedRoute>
                <NotificationsPage />
            </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
            <ProtectedRoute role="ADMIN">
                <AdminDashboard />
            </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
