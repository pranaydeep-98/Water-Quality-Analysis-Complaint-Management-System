import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const LoginPage = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Requirement: Admin login use fixed credentials logic if specified, 
        // but user also said "API: POST /auth/login"
        // I will allow them to login normally but redirect based on role
        try {
            const response = await api.post('/auth/login', { email: username, password }); // backend uses email as login identifier
            const { token, role, username: resName } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('username', resName);

            if (role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: 'auto' }}>
            <h2>{isAdmin ? 'Admin Login' : 'User Login'}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username (Email): </label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password: </label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                {!isAdmin && <p>Don't have an account? <Link to="/register">Register</Link></p>}
                <button onClick={() => setIsAdmin(!isAdmin)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
                    {isAdmin ? 'Switch to User Login' : 'Switch to Admin Login'}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
