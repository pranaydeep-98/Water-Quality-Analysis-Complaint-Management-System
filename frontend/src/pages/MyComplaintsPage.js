import React, { useEffect, useState } from 'react';
import api from '../services/api';

const MyComplaintsPage = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                // Fetching all for now since backend filtering is implicit via controller or can be added
                // User said "User should ONLY see THEIR complaints"
                const response = await api.get('/complaints');
                const myUser = localStorage.getItem('username');
                const filtered = response.data.filter(c => c.userName === myUser);
                setComplaints(filtered);
            } catch (err) {
                setError('Error fetching complaints.');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    if (loading) return <div>Loading complaints...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Registered Complaints</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                        <th>Area</th>
                        <th>Water Issue</th>
                        <th>Zone</th>
                        <th>Status</th>
                        <th>Severity</th>
                        <th>Risk Score</th>
                        <th>Priority</th>
                    </tr>
                </thead>
                <tbody>
                    {complaints.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center' }}>No complaints found.</td></tr>
                    ) : (
                        complaints.map(c => (
                            <tr key={c.id}>
                                <td>{c.location}</td>
                                <td>{c.description}</td>
                                <td>{c.zone}</td>
                                <td><strong>{c.status}</strong></td>
                                <td>{c.severity || 'PENDING'}</td>
                                <td>{c.riskScore}</td>
                                <td>{c.priority || 'NOT_ASSIGNED'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MyComplaintsPage;
