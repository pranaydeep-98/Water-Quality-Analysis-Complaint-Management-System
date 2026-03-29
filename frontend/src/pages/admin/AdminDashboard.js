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
  TrendingUp,
  ShieldAlert,
  MapPin,
  Map,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    resolved: 0,
    slaBreached: 0
  });
  const [statusSummary, setStatusSummary] = useState([]);
  const [complaintTrends, setComplaintTrends] = useState([]);
  const [topAreas, setTopAreas] = useState([]);
  const [slaOverview, setSlaOverview] = useState({ onTrack: 0, nearBreach: 0, breached: 0 });
  const [areaRisks, setAreaRisks] = useState([]);
  const [criticalComplaints, setCriticalComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      const allComplaints = res.data || [];

      // 1. Calculate Summary Metrics
      const total = allComplaints.length;
      const open = allComplaints.filter(c => c.status === 'Pending').length;
      const inProgress = allComplaints.filter(c => c.status === 'In Progress').length;
      const resolved = allComplaints.filter(c => c.status === 'Resolved').length;

      const now = new Date();
      const breachedCount = allComplaints.filter(c => {
        if (c.status === 'Resolved' || !c.deadline) return false;
        return new Date(c.deadline) < now;
      }).length;

      setMetrics({ total, open, inProgress, resolved, slaBreached: breachedCount });

      setMetrics({ total, open, inProgress, resolved, slaBreached: breachedCount });

      // 3. SLA Overview
      const sla = { onTrack: 0, nearBreach: 0, breached: 0 };
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      allComplaints.forEach(c => {
        if (c.status === 'Resolved') return;
        if (!c.deadline) {
          sla.onTrack++;
          return;
        }
        const deadline = new Date(c.deadline);
        if (deadline < now) sla.breached++;
        else if (deadline < tomorrow) sla.nearBreach++;
        else sla.onTrack++;
      });
      setSlaOverview(sla);

      // 4. Critical Complaints Table
      const critical = [...allComplaints]
        .filter(c => c.status !== 'Resolved')
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
        .slice(0, 8);
      setCriticalComplaints(critical);

      // 6. Fetch Chart Data
      const [statusRes, trendRes, areaRiskRes] = await Promise.all([
        api.get('/admin/status-summary').catch(() => ({ data: {} })),
        api.get('/admin/complaints-trend').catch(() => ({ data: [] })),
        api.get('/admin/area-risk').catch(() => ({ data: [] }))
      ]);

      const areaData = areaRiskRes.data || [];
      setAreaRisks(areaData);
      setTopAreas(areaData.slice(0, 5));

      const stData = statusRes.data || {};
      setStatusSummary([
        { name: 'Open', value: stData['Open'] || 0, color: '#f87171' },
        { name: 'In Progress', value: stData['In Progress'] || 0, color: '#fbbf24' },
        { name: 'Resolved', value: stData['Resolved'] || 0, color: '#10b981' }
      ]);

      const trendData = trendRes.data || [];
      setComplaintTrends(trendData.map(t => ({
          date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: t.count
      })));

    } catch (err) {
      console.error("Dashboard calculation failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSLAStatusLabel = (complaint) => {
    if (complaint.status === 'Resolved') return { text: 'N/A', class: 'sla-na' };
    if (!complaint.deadline) return { text: 'On Track', class: 'sla-ok' };

    const now = new Date();
    const deadline = new Date(complaint.deadline);
    if (deadline < now) return { text: 'Breached', class: 'sla-breached' };

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (deadline < tomorrow) return { text: 'Near Breach', class: 'sla-warning' };

    return { text: 'On Track', class: 'sla-ok' };
  };

  const handleAction = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/admin-update`, { status });
      fetchDashboardData();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  return (
    <div className="dashboard-wrapper operational-focus">
      <header className="dashboard-header">
        <h1>Operational Dashboard</h1>
        <p>Real-time complaint monitoring & risk assessment</p>
      </header>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card glass-card purple" onClick={() => navigate('/admin/complaints')}>
          <div className="kpi-icon"><Layers size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Complaints</span>
            <span className="kpi-value">{loading ? '...' : metrics.total}</span>
          </div>
        </div>
        <div className="kpi-card glass-card info" onClick={() => navigate('/admin/complaints')}>
          <div className="kpi-icon"><AlertCircle size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Open</span>
            <span className="kpi-value">{loading ? '...' : metrics.open}</span>
          </div>
        </div>
        <div className="kpi-card glass-card warning" onClick={() => navigate('/admin/complaints')}>
          <div className="kpi-icon"><Clock size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">In Progress</span>
            <span className="kpi-value">{loading ? '...' : metrics.inProgress}</span>
          </div>
        </div>
        <div className="kpi-card glass-card success" onClick={() => navigate('/admin/complaints')}>
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Resolved</span>
            <span className="kpi-value">{loading ? '...' : metrics.resolved}</span>
          </div>
        </div>
        <div className="kpi-card glass-card danger" onClick={() => navigate('/admin/sla')}>
          <div className="kpi-icon"><AlertTriangle size={22} /></div>
          <div className="kpi-content">
            <span className="kpi-label">SLA Breached</span>
            <span className="kpi-value">{loading ? '...' : metrics.slaBreached}</span>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        {/* Area Risk Comparison Chart */}
        <div className="analytics-card glass-card">
          <div className="card-header">
            <h3><Map size={18} /> Top 5 Area Risks</h3>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={topAreas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="areaRiskScore" radius={[4, 4, 0, 0]}>
                  {topAreas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.areaRiskScore > 75 ? '#f87171' : entry.areaRiskScore >= 40 ? '#fbbf24' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Status Distribution */}
        <div className="analytics-card glass-card">
          <div className="card-header">
            <h3><PieIcon size={18} /> Status Distribution</h3>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusSummary} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {statusSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        {/* Trend Chart */}
        <div className="analytics-card glass-card">
          <div className="card-header">
            <h3><TrendingUp size={18} /> 7-Day Complaint Trend</h3>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={complaintTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Status Overview */}
        <div className="analytics-card glass-card">
          <div className="card-header">
            <h3><TrendingUp size={18} /> SLA Performance</h3>
          </div>
          <div className="sla-overview-grid">
            <div className="sla-stat-box green">
              <span className="val">{slaOverview.onTrack}</span>
              <span className="lbl">On Track</span>
            </div>
            <div className="sla-stat-box orange">
              <span className="val">{slaOverview.nearBreach}</span>
              <span className="lbl">Near Breach</span>
            </div>
            <div className="sla-stat-box red">
              <span className="val">{slaOverview.breached}</span>
              <span className="lbl">Breached</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Risk Overview Section */}
      <div className="geographic-risk-section glass-card">
        <div className="card-header">
           <h3><MapPin size={18} /> Geographic Risk Overview: Multi-Complaint Clusters</h3>
           <span className="subtitle">Real-time systemic risk analysis per area</span>
        </div>
        <div className="area-risk-grid">
           {areaRisks.length > 0 ? areaRisks.map((ar, idx) => (
             <div key={idx} className={`area-risk-card level-${ar.level.toLowerCase()}`}>
                <div className="area-header">
                   <div className="area-info">
                      <span className="area-name">{ar.area}</span>
                      <span className="zone-tag">{ar.zone}</span>
                   </div>
                   <div className={`risk-badge ${ar.level.toLowerCase()}`}>{ar.level}</div>
                </div>
                <div className="area-metrics">
                   <div className="m-item">
                      <span className="m-label">Active Reports</span>
                      <span className="m-value">{ar.complaintCount}</span>
                   </div>
                   <div className="m-item">
                      <span className="m-label">Avg Risk Score</span>
                      <span className="m-value">{ar.areaRiskScore}</span>
                   </div>
                </div>
                <div className="risk-indicator-bar-container">
                   <div className="indicator-track">
                      <div className="indicator-fill" style={{ width: `${ar.areaRiskScore}%` }}></div>
                   </div>
                </div>
             </div>
           )) : (
             <div className="empty-areas">No critical geographic clusters currently active.</div>
           )}
        </div>
      </div>

      {/* Critical Complaints Table */}
      <div className="critical-table-container glass-card">
        <div className="card-header">
          <h3><AlertTriangle size={18} color="#f87171" /> High-Priority Resolution Queue</h3>
          <button className="text-link" onClick={() => navigate('/admin/complaints')}>View All Complaints <ArrowRight size={14} /></button>
        </div>
        <div className="table-responsive">
          <table className="critical-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Area</th>
                <th>Issue Type</th>
                <th>Reporters</th>
                <th>Risk Score</th>
                <th>SLA Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {criticalComplaints.map(complaint => {
                const sla = getSLAStatusLabel(complaint);
                return (
                  <tr key={complaint.id}>
                    <td>#{complaint.id}</td>
                    <td>{complaint.area}</td>
                    <td>{complaint.issueType}</td>
                    <td>
                      <span className="reporter-count">
                        {complaint.duplicateCount || 1}
                      </span>
                    </td>
                    <td>
                      <div className="risk-score-indicator">
                        <span className={`score-badge ${complaint.riskScore > 75 ? 'urgent' : complaint.riskScore > 40 ? 'elevated' : 'normal'}`}>
                          {complaint.riskScore || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`sla-badge ${sla.class}`}>{sla.text}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${complaint.status.toLowerCase().replace(' ', '-')}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {complaint.status === 'Pending' && (
                        <button className="action-icon-btn info" title="Mark In Progress" onClick={() => handleAction(complaint.id, 'In Progress')}>
                          <Clock size={16} />
                        </button>
                      )}
                      {['Pending', 'In Progress'].includes(complaint.status) && (
                        <button className="action-icon-btn success" title="Resolve" onClick={() => handleAction(complaint.id, 'Resolved')}>
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {complaint.status !== 'Escalated' && complaint.status !== 'Resolved' && (
                        <button className="action-icon-btn danger" title="Escalate" onClick={() => handleAction(complaint.id, 'Escalated')}>
                          <ShieldAlert size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {criticalComplaints.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-row text-center py-4">No critical complaints found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
