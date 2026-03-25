import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  X,
  Bell,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, overdue: 0, resolved: 0 });
  const [alerts, setAlerts] = useState([]);
  const [riskAreas, setRiskAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      const allComplaints = res.data || [];

      const total = allComplaints.length;
      const pendingStatuses = ['Pending', 'In Progress', 'Escalated'];
      const pending = allComplaints.filter(c => pendingStatuses.includes(c.status)).length;
      const resolved = allComplaints.filter(c => c.status === 'Resolved').length;

      const today = new Date();
      today.setHours(0,0,0,0);
      const overdue = allComplaints.filter(c => {
        if (c.status === 'Resolved' || !c.deadline) return false;
        const deadlineDate = new Date(c.deadline);
        return deadlineDate < today;
      }).length;

      setMetrics({ total, pending, overdue, resolved });

      const newAlerts = [];
      if (overdue > 0) newAlerts.push({ id: 'alert-overdue', message: `${overdue} complaint(s) are actively overdue.`, area: 'System Alert' });
      
      const pendingHigh = allComplaints.filter(c => c.severity === 'HIGH' && c.status === 'Pending').length;
      if (pendingHigh > 0) newAlerts.push({ id: 'alert-high', message: `${pendingHigh} HIGH severity complaints remain untouched.`, area: 'Critical Alert' });
      
      const escalated = allComplaints.filter(c => c.status === 'Escalated').length;
      if (escalated > 0) newAlerts.push({ id: 'alert-esc', message: `${escalated} complaints have been escalated.`, area: 'Attention Required' });
      
      setAlerts(newAlerts);

      const riskMapping = {};
      allComplaints.forEach(c => {
        if (!riskMapping[c.area]) riskMapping[c.area] = { area: c.area, score: 0, count: 0 };
        riskMapping[c.area].count += 1;
        if (c.severity === 'HIGH') riskMapping[c.area].score += 5;
        if (c.severity === 'MEDIUM') riskMapping[c.area].score += 3;
        if (c.severity === 'LOW') riskMapping[c.area].score += 1;
      });

      const processedRisks = Object.values(riskMapping)
        .filter(item => item.score > 10)
        .sort((a,b) => b.score - a.score);

      setRiskAreas(processedRisks);
    } catch (err) {
      console.error("Dashboard Sync Failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="dashboard-wrapper action-centric">
      
      {/* 1. Dashboard KPIs */}
      <div className="kpi-grid">
         <div className="kpi-card glass-card primary" onClick={() => navigate('/admin/complaints')}>
           <div className="kpi-icon"><Layers size={24} /></div>
           <div className="kpi-value">{loading ? <Loader2 className="spinner" size={24} /> : metrics.total}</div>
           <div className="kpi-title">Total Monitoring Logs</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
         <div className="kpi-card glass-card warning" onClick={() => navigate('/admin/complaints')}>
           <div className="kpi-icon"><Clock size={24} /></div>
           <div className="kpi-value">{loading ? <Loader2 className="spinner" size={24} /> : metrics.pending}</div>
           <div className="kpi-title">Active Pending Tasks</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
         <div className="kpi-card glass-card danger" onClick={() => navigate('/admin/sla')}>
           <div className="kpi-icon"><AlertTriangle size={24} /></div>
           <div className="kpi-value">{loading ? <Loader2 className="spinner" size={24} /> : metrics.overdue}</div>
           <div className="kpi-title">Overdue Breaches</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
         <div className="kpi-card glass-card success" onClick={() => navigate('/admin/complaints')}>
           <div className="kpi-icon"><CheckCircle2 size={24} /></div>
           <div className="kpi-value">{loading ? <Loader2 className="spinner" size={24} /> : metrics.resolved}</div>
           <div className="kpi-title">Successfully Resolved</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
      </div>

      <div className="dashboard-grid-simple">
         
         {/* Alerts Feed */}
         <div className="dashboard-card glass-card alerts-feed">
            <div className="card-header">
               <h3><Bell size={20} /> Operational Alerts</h3>
               <span className="badge danger">{alerts.length} New</span>
            </div>
            <div className="alerts-list">
               {alerts.length > 0 ? alerts.map(alert => (
                 <div key={alert.id} className="alert-item glass">
                    <div className="alert-marker"></div>
                    <div className="alert-body">
                       <p>{alert.message}</p>
                       <span className="alert-time">{alert.area}</span>
                    </div>
                    <button className="dismiss-btn" onClick={() => dismissAlert(alert.id)}>
                       <X size={16} />
                    </button>
                 </div>
               )) : (
                 <div className="empty-state">No active alerts. System stable.</div>
               )}
            </div>
         </div>

         {/* High Risk Targets */}
         <div className="dashboard-card glass-card risk-targets">
            <div className="card-header">
               <h3>Critical Risk Zones</h3>
               <button className="text-btn" onClick={() => navigate('/admin/risk')}>View Map</button>
            </div>
            <div className="risk-target-list">
               {riskAreas.slice(0, 5).map((area, idx) => (
                 <div key={idx} className={`risk-node ${area.count >= 3 ? 'active-critical' : ''}`}>
                    <div className="node-info">
                       <strong>{area.area}</strong>
                       <span>{area.count} Concurrent Reports</span>
                    </div>
                    <div className="node-val">
                       {area.count >= 3 ? <span className="pulse-dot"></span> : null}
                       Risk Index: {area.count * 15 > 100 ? 100 : area.count * 15}
                    </div>
                 </div>
               ))}
               {riskAreas.length === 0 && <div className="empty-state">No high risk zones detected.</div>}
            </div>
         </div>

      </div>

      <div className="action-footer-banner glass-card" onClick={() => navigate('/admin/complaints')}>
         <div className="banner-content">
            <h4>Ready for Operation?</h4>
            <p>Access the main terminal to update complaint statuses, add remarks, and resolve issues.</p>
         </div>
         <button className="banner-btn">Open Main Terminal</button>
      </div>

    </div>
  );
};

export default AdminDashboard;
