import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  BellRing, 
  ShieldAlert, 
  Clock, 
  Save, 
  Mail, 
  MessageSquare,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [slaHours, setSlaHours] = useState({
    high: 4,
    medium: 24,
    low: 72
  });
  
  const [notifications, setNotifications] = useState({
    slaBreach: true,
    highSeverity: true,
    dailyReport: false,
    duplicateAlerts: true
  });

  const handleSlaChange = (e) => {
    setSlaHours({ ...slaHours, [e.target.name]: e.target.value });
  };

  const handleNotifyChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <div className="admin-page-content settings-page">
      <div className="settings-grid">
         <div className="settings-card sla-config glass-card">
            <div className="card-header">
               <div className="title-row">
                  <Clock size={20} className="text-primary" />
                  <h2>SLA Threshold Configuration</h2>
               </div>
            </div>
            
            <form className="config-form">
               <div className="form-group">
                  <label>High Severity SLA (Hours)</label>
                  <div className="input-row">
                     <AlertTriangle size={16} className="text-danger" />
                     <input 
                       type="number" 
                       name="high"
                       value={slaHours.high} 
                       onChange={handleSlaChange}
                     />
                  </div>
               </div>
               <div className="form-group">
                  <label>Medium Severity SLA (Hours)</label>
                  <div className="input-row">
                     <Clock size={16} className="text-warning" />
                     <input 
                       type="number" 
                       name="medium"
                       value={slaHours.medium} 
                       onChange={handleSlaChange}
                     />
                  </div>
               </div>
               <div className="form-group">
                  <label>Low Severity SLA (Hours)</label>
                  <div className="input-row">
                     <CheckCircle size={16} className="text-success" />
                     <input 
                       type="number" 
                       name="low"
                       value={slaHours.low} 
                       onChange={handleSlaChange}
                     />
                  </div>
               </div>
               
               <button type="button" className="btn-save primary">
                  <Save size={18} /> Save Thresholds
               </button>
            </form>
         </div>

         <div className="settings-card notification-prefs glass-card">
            <div className="card-header">
               <div className="title-row">
                  <BellRing size={20} className="text-primary" />
                  <h2>Notification Preferences</h2>
               </div>
            </div>

            <div className="prefs-list">
               <PreferenceItem 
                 label="Email alert on SLA breach" 
                 active={notifications.slaBreach} 
                 onChange={() => handleNotifyChange('slaBreach')}
                 icon={<Mail size={18} />}
               />
               <PreferenceItem 
                 label="SMS alert for high severity" 
                 active={notifications.highSeverity} 
                 onChange={() => handleNotifyChange('highSeverity')}
                 icon={<MessageSquare size={18} />}
               />
               <PreferenceItem 
                 label="Daily summary report email" 
                 active={notifications.dailyReport} 
                 onChange={() => handleNotifyChange('dailyReport')}
                 icon={<Activity size={18} />}
               />
               <PreferenceItem 
                 label="Duplicate detection alerts" 
                 active={notifications.duplicateAlerts} 
                 onChange={() => handleNotifyChange('duplicateAlerts')}
                 icon={<ShieldAlert size={18} />}
               />
            </div>
            
            <button type="button" className="btn-save secondary full-width">
               Update Preferences
            </button>
         </div>
      </div>

      <div className="system-status-panel glass-card">
         <div className="section-header">
            <h2>System Global Status</h2>
            <SettingsIcon size={18} className="text-muted" />
         </div>
         <div className="status-grid">
            <StatusIndicator label="API Engine" status="Online" />
            <StatusIndicator label="Database Cluster" status="Healthy" />
            <StatusIndicator label="JWT Auth Service" status="Responsive" />
            <StatusIndicator label="Email Gateway" status="Active" />
         </div>
      </div>
    </div>
  );
};

const PreferenceItem = ({ label, active, onChange, icon }) => (
  <div className="preference-item glass-mini" onClick={onChange}>
     <div className="pref-left">
        {icon}
        <span>{label}</span>
     </div>
     <div className={`toggle-switch ${active ? 'on' : 'off'}`}>
        <div className="switch-knob"></div>
     </div>
  </div>
);

const StatusIndicator = ({ label, status }) => (
  <div className="status-item glass-mini">
     <label>{label}</label>
     <div className="status-row">
        <span className="dot pulse"></span>
        <span className="status-val">{status}</span>
     </div>
  </div>
);

export default Settings;
