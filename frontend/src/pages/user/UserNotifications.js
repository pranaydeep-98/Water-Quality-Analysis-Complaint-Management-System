import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  AlertCircle, 
  Zap, 
  Clock, 
  CheckCircle,
  Loader2,
  Trash2,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import './UserNotifications.css';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
      
      // Mark all as read after fetching
      if (response.data?.some(n => !n.read)) {
        await api.put('/notifications/mark-all-read');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'ESCALATED': return <Clock size={20} className="text-danger" />;
      case 'RESOLVED': return <CheckCircle size={20} className="text-success" />;
      case 'STATUS_UPDATE': return <Bell size={20} className="text-blue" />;
      case 'SYSTEM_ALERT': return <Zap size={20} className="text-danger" />;
      default: return <Bell size={20} className="text-primary" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="user-notif-container">
      <div className="notif-header-row">
         <div>
            <h1>Operational Alerts</h1>
            <p>Real-time updates on your incidents and infrastructure status.</p>
         </div>
      </div>

      <div className="notif-body glass-card">
         {loading ? (
           <div className="loader-container"><Loader2 size={40} className="spinner" /> Synchronizing alerts...</div>
         ) : notifications.length > 0 ? (
           <div className="notif-feed">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`notif-card ${n.isRead ? 'read' : 'unread'}`}
                >
                   <div className="notif-icon-box">
                      {getIcon(n.type)}
                   </div>
                   <div className="notif-text-box">
                      <p className="notif-msg">{n.message}</p>
                      <div className="notif-meta">
                         <span className="notif-type-label">{n.type?.replace('_', ' ')}</span>
                         <span className="notif-time"><Calendar size={12} /> {new Date(n.createdAt).toLocaleDateString()} • {getTimeAgo(n.createdAt)}</span>
                      </div>
                   </div>
                   {!n.isRead && <div className="unread-dot"></div>}
                </div>
              ))}
           </div>
         ) : (
           <div className="empty-state">
              <div className="icon-empty"><Bell size={48} /></div>
              <h3>Operation Center Clear</h3>
              <p>You have no operational alerts at this time.</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default UserNotifications;
