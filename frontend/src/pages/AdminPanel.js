import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminPanel = () => {
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

    const handleUpdate = async (id, status, priority) => {
        try {
            // Update status and priority
            // For now, updateStatus endpoint exists, let's assume we use it or create a new one
            // Let's use a generic update endpoint if possible, but let's stick to status if that's all we have for now
            // I'll update current status and then update priority
            await api.put(`/complaints/${id}/admin-update`, { status, priority });
            setMessage('Complaint updated successfully!');
            fetchComplaints();
        } catch (err) {
            setMessage('Error updating complaint.');
        }
    };

    if (loading) return <div className="container">Loading complaint processing queue...</div>;

    return (
        <div className="container-wide">
            <h1>Admin Processing Panel</h1>
            {message && <div className="success-msg">{message}</div>}
            
            <div className="admin-table-container card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Area/Zone</th>
                            <th>Issue</th>
                            <th>Severity</th>
                            <th>Risk</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map(c => (
                            <tr key={c.id}>
                                <td>{c.userName}</td>
                                <td>{c.location}<br/><small>{c.zone}</small></td>
                                <td>{c.description}</td>
                                <td><span className={`sev-tag ${c.severity.toLowerCase()}`}>{c.severity}</span></td>
                                <td className="font-bold">{c.riskScore}</td>
                                <td>
                                    <select 
                                        defaultValue={c.priority || ''}
                                        onChange={(e) => handleUpdate(c.id, c.status, e.target.value)}
                                    >
                                        <option value="" disabled>Select</option>
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </td>
                                <td>
                                    <select 
                                        defaultValue={c.status}
                                        onChange={(e) => handleUpdate(c.id, e.target.value, c.priority)}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="ESCALATED">Escalated</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </td>
                                <td>
                                    <button onClick={() => handleUpdate(c.id, c.status, c.priority)} className="save-btn">
                                        Update
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;
