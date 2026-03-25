import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { role, logout } = useAuth() || {};
    const currentRole = role || localStorage.getItem('role');

    const handleLogout = () => {
        if (logout) {
            logout();
        } else {
            localStorage.clear();
        }
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">WaterQuality</div>
            <div className="navbar-links">
                <Link to="/">Dashboard</Link>
                <Link to="/complaints">Complaints</Link>
                <Link to="/notifications">Notifications</Link>
                {currentRole === 'ADMIN' && (
                    <>
                        <Link to="/admin">Analytics</Link>
                        <Link to="/admin/process">Process Queue</Link>
                    </>
                )}
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
