import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage = () => {
    const [username, setUsername] = useState(''); // email mapping
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register', { name, email: username, password, role: 'USER' });
            navigate('/login');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data || err.message || 'Registration failed.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: 'auto' }}>
            <h2>Register</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Full Name: </label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username (Email): </label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password: </label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p style={{ marginTop: '10px', textAlign: 'center' }}>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    );
};

export default RegisterPage;
