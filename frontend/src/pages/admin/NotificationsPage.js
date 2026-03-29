import React, { useEffect, useState } from 'react';
import api from '../services/api';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const role = localStorage.getItem('role');
                const endpoint = role === 'ADMIN' ? '/notifications/admin' : '/notifications/user';
                const response = await api.get(endpoint);
                setNotifications(response.data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    if (loading) return <div>Loading notifications...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Notifications</h2>
            {notifications.length === 0 ? (
                <p>No new notifications.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {notifications.map(n => (
                        <div key={n.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
                            <p><strong>{n.type} ALERT</strong> - {new Date(n.createdAt).toLocaleString()} </p>
                            <p>{n.message}</p>
                            {n.location && <small>Location: {n.location}</small>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
