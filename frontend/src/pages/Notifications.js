import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Notifications = () => {
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

    if (loading) return <div className="container">Loading notifications...</div>;

    return (
        <div className="container">
            <h1>Notifications</h1>
            <div className="notification-list">
                {notifications.length === 0 ? (
                    <p>No notifications.</p>
                ) : (
                    notifications.map((n) => (
                        <div key={n.id} className={`notification-card card ${n.type.toLowerCase()}`}>
                            <div className="notification-header">
                                <span className="notification-type">{n.type} ALERT</span>
                                <span className="notification-date">{new Date(n.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p>{n.message}</p>
                            {n.location && <small>Location: {n.location}</small>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
