import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  X,
  Bell,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, overdue: 0, resolved: 0 });
  const [alerts, setAlerts] = useState([]);
  const [riskAreas, setRiskAreas] = useState([]);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const metricRes = await api.get('/complaints/metrics');
      setMetrics(metricRes.data);

      const alertRes = await api.get('/notifications/admin');
      setAlerts(alertRes.data || []);

      const riskRes = await api.get('/admin/risk-scores');
      setRiskAreas(riskRes.data || []);
    } catch (err) {
      console.error("Dashboard Sync Failed", err);
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
           <div className="kpi-value">{metrics.total}</div>
           <div className="kpi-title">Total Monitoring Logs</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
         <div className="kpi-card glass-card warning" onClick={() => navigate('/admin/complaints')}>
           <div className="kpi-icon"><Clock size={24} /></div>
           <div className="kpi-value">{metrics.pending}</div>
           <div className="kpi-title">Active Pending Tasks</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
         <div className="kpi-card glass-card danger" onClick={() => navigate('/admin/sla')}>
           <div className="kpi-icon"><AlertTriangle size={24} /></div>
           <div className="kpi-value">{metrics.overdue}</div>
           <div className="kpi-title">Overdue Breaches</div>
           <ArrowRight className="card-arrow" size={16} />
         </div>
         <div className="kpi-card glass-card success" onClick={() => navigate('/admin/complaints')}>
           <div className="kpi-icon"><CheckCircle2 size={24} /></div>
           <div className="kpi-value">{metrics.resolved}</div>
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
