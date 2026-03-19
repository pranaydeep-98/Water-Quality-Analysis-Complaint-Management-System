import React, { useState } from 'react';
import api from '../services/api';

const UserDashboard = () => {
    const [area, setArea] = useState('');
    const [waterIssue, setWaterIssue] = useState('');
    const [zone, setZone] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const userName = localStorage.getItem('username');
        try {
            await api.post('/complaints', { 
                area, 
                waterIssue, 
                zone, 
                phoneNumber,
                userName 
            });
            setMessage('Complaint submitted successfully!');
            setArea('');
            setWaterIssue('');
            setZone('');
            setPhoneNumber('');
        } catch (err) {
            setMessage('Error submitting complaint: ' + (err.response?.data || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
            <h2>User Dashboard - Submit Complaint</h2>
            {message && <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Area: </label>
                    <input type="text" value={area} onChange={e => setArea(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Zone: </label>
                    <input type="text" value={zone} onChange={e => setZone(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Phone Number: </label>
                    <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Water Quality Issue: </label>
                    <textarea value={waterIssue} onChange={e => setWaterIssue(e.target.value)} required style={{ width: '100%', height: '100px' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                    {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
            </form>
        </div>
    );
};

export default UserDashboard;
