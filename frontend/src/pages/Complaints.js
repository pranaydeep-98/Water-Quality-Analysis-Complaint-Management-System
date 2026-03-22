import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Complaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchComplaints();
    }, []);

    if (loading) return <div className="container">Loading my complaints...</div>;

    return (
        <div className="container">
            <h1>My Registered Complaints</h1>
            <div className="complaint-list">
                {complaints.length === 0 ? (
                    <p>No complaints filed yet.</p>
                ) : (
                    complaints.map((c) => (
                        <div key={c.id} className="complaint-card card">
                            <div className="complaint-header">
                                <span className={`status-badge status-${c.status.toLowerCase().replace('_', '-')}`}>
                                    {c.status}
                                </span>
                                <span className="priority-badge">
                                    Priority: {c.priority || 'NOT_ASSIGNED'}
                                </span>
                                <span className="complaint-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3>{c.location} (Zone: {c.zone || 'N/A'})</h3>
                            <p className="issue-text"><strong>Issue:</strong> {c.description}</p>
                            
                            <div className="complaint-grid">
                                <div className="meta-item">
                                    <label>Severity</label>
                                    <span className={`severity-${c.severity.toLowerCase()}`}>{c.severity}</span>
                                </div>
                                <div className="meta-item">
                                    <label>Risk Score</label>
                                    <span>{c.riskScore || 0}</span>
                                </div>
                                <div className="meta-item">
                                    <label>Phone</label>
                                    <span>{c.phoneNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Complaints;
