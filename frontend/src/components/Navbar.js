import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">WaterQuality</div>
            <div className="navbar-links">
                <Link to="/">Dashboard</Link>
                <Link to="/complaints">Complaints</Link>
                <Link to="/notifications">Notifications</Link>
                {role === 'ADMIN' && (
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
