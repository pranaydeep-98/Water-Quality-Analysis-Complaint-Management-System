import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  AlertCircle, 
  History, 
  ChevronRight, 
  ShieldCheck,
  Zap,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import './SLAMonitor.css';

const SLAMonitor = () => {
  const [slaStats, setSlaStats] = useState({
    onTrack: 28,
    atRisk: 12,
    breached: 5,
    avgResTime: '15.2 hrs'
  });
  const [compliance, setCompliance] = useState([
    { type: 'High', sla: 4, compliance: 88, color: '#E8433A' },
    { type: 'Medium', sla: 24, compliance: 92, color: '#F6921E' },
    { type: 'Low', sla: 72, compliance: 100, color: '#2DDBB4' }
  ]);
  const [escalations, setEscalations] = useState([]);

  useEffect(() => {
    const fetchSlaData = async () => {
      try {
        const res = await api.get('/sla/status');
        setSlaStats(res.data.stats || {
          onTrack: 28,
          atRisk: 12,
          breached: 5,
          avgResTime: '14.8 hrs'
        });
        setCompliance(res.data.compliance || [
          { type: 'High', sla: 4, compliance: 85, color: '#E8433A' },
          { type: 'Medium', sla: 24, compliance: 94, color: '#F6921E' },
          { type: 'Low', sla: 72, compliance: 98, color: '#2DDBB4' }
        ]);
        setEscalations(res.data.escalations || [
          { id: 1, type: 'Critical', event: 'Auto Escalation (Level 2)', area: 'Central Park', time: '10:45 AM', icon: <Zap size={14} className="text-danger" /> },
          { id: 2, type: 'Warning', event: 'SLA Breach (Level 1)', area: 'North District', time: '09:12 AM', icon: <AlertCircle size={14} className="text-warning" /> }
        ]);
      } catch (err) {
        console.error("Failed to fetch SLA data", err);
      }
    };
    fetchSlaData();
  }, []);

  return (
    <div className="admin-page-content sla-monitor">
      <div className="kpi-grid four">
         <SLACard title="On Track" value={slaStats.onTrack} color="green" icon={<CheckCircle size={24} />} />
         <SLACard title="At Risk" value={slaStats.atRisk} color="gold" icon={<Clock size={24} />} />
         <SLACard title="Breached" value={slaStats.breached} color="red" icon={<AlertCircle size={24} />} />
         <SLACard title="Avg Res Time" value={slaStats.avgResTime} color="blue" icon={<Activity size={24} />} />
      </div>

      <div className="sla-dashboard-grid">
         <div className="sla-card-view compliance-bars glass-card">
            <div className="card-header">
               <h2>Service Level Agreement Compliance</h2>
               <ShieldCheck size={18} className="text-muted" />
            </div>
            
            <div className="compliance-list">
               {compliance.map((item, idx) => (
                 <div key={idx} className="compliance-item glass-mini">
                    <div className="comp-info">
                       <div className="label-row">
                          <h3>{item.type} Severity</h3>
                          <span>SLA: {item.sla} Hours</span>
                       </div>
                       <div className="rate-row">
                          <span className="rate-val">{item.compliance}%</span>
                          <span className="rate-label">Compliance</span>
                       </div>
                    </div>
                    <div className="comp-progress">
                       <div className="bar-bg">
                          <div className="bar-fill" style={{ width: `${item.compliance}%`, background: item.color }}></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="sla-card-view escalation-log glass-card">
            <div className="card-header">
               <h2>Auto-Escalation Log</h2>
               <History size={18} className="text-muted" />
            </div>
            
            <div className="escalation-timeline scrollable">
               {escalations.length > 0 ? escalations.map((log) => (
                 <div key={log.id} className="timeline-event glass-mini">
                    <div className="event-marker">
                       {log.icon}
                       <div className="line"></div>
                    </div>
                    <div className="event-content">
                       <div className="event-header">
                          <span className="event-name">{log.event}</span>
                          <span className="event-time">{log.time}</span>
                       </div>
                       <div className="event-footer">
                          <span className="event-type">{log.type}</span>
                          <span className="event-area">{log.area}</span>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="empty-log text-muted">No escalations triggered in the last 24 hours.</div>
               )}
            </div>
            <button className="view-full-log">View Historical Logs <ChevronRight size={16} /></button>
         </div>
      </div>
    </div>
  );
};

const SLACard = ({ title, value, color, icon }) => (
  <div className={`kpi-card glass-card color-${color}`}>
     <div className="kpi-icon-row">
        <div className="icon-circle">{icon}</div>
     </div>
     <div className="kpi-value">{value}</div>
     <div className="kpi-title">{title}</div>
  </div>
);

export default SLAMonitor;
