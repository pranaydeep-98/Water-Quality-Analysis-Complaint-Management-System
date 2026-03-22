import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Zap, 
  Clock, 
  CheckCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import api from '../../services/api';
import './UserNotifications.css';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/user');
        setNotifications(response.data || [
          { id: 1, type: 'HIGH_SEVERITY', message: 'High severity complaint submitted successfully.', createdAt: 'Just now', read: false },
          { id: 2, type: 'CLUSTER', message: 'Cluster detected in your area based on recent reports.', createdAt: '2 hours ago', read: false },
          { id: 3, type: 'HIGH_RISK', message: 'High risk area alert. Authorities have been notified.', createdAt: '1 day ago', read: true },
          { id: 4, type: 'OVERDUE', message: 'Complaint #4210 is overdue. Escalation initiated.', createdAt: '2 days ago', read: true },
          { id: 5, type: 'STATUS_UPDATE', message: 'Status updated to In Progress for your report.', createdAt: '1 week ago', read: true }
        ]);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      // In a real app we'd call an API to mark as read
      // await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'HIGH_SEVERITY': return <AlertCircle size={20} className="text-danger" />;
      case 'CLUSTER': return <AlertTriangle size={20} className="text-warning" />;
      case 'HIGH_RISK': return <Zap size={20} className="text-warning" />;
      case 'OVERDUE': return <Clock size={20} className="text-danger" />;
      case 'STATUS_UPDATE': return <CheckCircle size={20} className="text-success" />;
      default: return <Bell size={20} className="text-primary" />;
    }
  };

  return (
    <div className="user-notif-container">
      <div className="notif-header-row">
         <div>
            <h1>Notifications Centre</h1>
            <p>Stay updated on your complaints and area alerts.</p>
         </div>
         {notifications.length > 0 && (
           <button className="btn-secondary clear-btn" onClick={clearAll}>
             <Trash2 size={16} /> Clear All
           </button>
         )}
      </div>

      <div className="notif-body glass-card">
         {loading ? (
           <div className="loader-container"><Loader2 size={40} className="spinner" /></div>
         ) : notifications.length > 0 ? (
           <div className="notif-feed">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notif-card ${n.read ? 'read' : 'unread'}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                   <div className="notif-icon-box">
                      {getIcon(n.type)}
                   </div>
                   <div className="notif-text-box">
                      <p className="notif-msg">{n.message}</p>
                      <div className="notif-meta">
                         <span className="notif-type-label">{n.type.replace('_', ' ')}</span>
                         <span className="notif-time">{n.createdAt}</span>
                      </div>
                   </div>
                   {!n.read && <div className="unread-dot"></div>}
                </div>
              ))}
           </div>
         ) : (
           <div className="empty-state">
              <div className="icon-empty"><Bell size={48} /></div>
              <h3>All Caught Up</h3>
              <p>You have no new notifications at this time.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default UserNotifications;
