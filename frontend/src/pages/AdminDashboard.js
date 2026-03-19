import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await api.get('/complaints');
            setComplaints(response.data);
        } catch (err) {
            console.error('Error fetching complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminUpdate = async (id, status, priority, severity) => {
        setMessage('');
        try {
            await api.put(`/complaints/${id}/admin-update`, { status, priority, severity });
            setMessage('Updated successfully!');
            fetchComplaints();
        } catch (err) {
            setMessage('Error updating: ' + (err.response?.data || 'Unknown error'));
        }
    };

    if (loading) return <div>Loading administration portal...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Admin Dashboard - Processing Queue</h1>
            {message && <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
            
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                        <th>User</th>
                        <th>Area / Zone</th>
                        <th>Issue</th>
                        <th>Status</th>
                        <th>Severity</th>
                        <th>Priority</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {complaints.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center' }}>No complaints found.</td></tr>
                    ) : (
                        complaints.map(c => (
                            <tr key={c.id}>
                                <td>{c.userName}</td>
                                <td>{c.location}<br/><small>Zone: {c.zone}</small></td>
                                <td>{c.description}</td>
                                <td>
                                    <select 
                                        defaultValue={c.status}
                                        onChange={(e) => handleAdminUpdate(c.id, e.target.value, c.priority, c.severity)}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="ESCALATED">Escalated</option>
                                    </select>
                                </td>
                                <td>
                                    <select 
                                        defaultValue={c.severity || 'LOW'}
                                        onChange={(e) => handleAdminUpdate(c.id, c.status, c.priority, e.target.value)}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </td>
                                <td>
                                    <select 
                                        defaultValue={c.priority || ''}
                                        onChange={(e) => handleAdminUpdate(c.id, c.status, e.target.value, c.severity)}
                                    >
                                        <option value="" disabled>Select</option>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </td>
                                <td>
                                    <button onClick={() => fetchComplaints()}>Refresh</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;
