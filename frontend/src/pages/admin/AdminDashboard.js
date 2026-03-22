import React, { useState, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user = null } = useAuth() || {};
  const [stats, setStats] = useState({
    totalComplaints: 0,
    highSeverity: 0,
    slaBreaches: 0,
    resolvedToday: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'danger', message: 'SLA Breach detected in ZONE-A: Contamination report overdue by 4 hours.', persistent: true },
    { id: 2, type: 'warning', message: 'High duplicate cluster detected in ZONE-B: 12 reports of Water Pressure issues.', persistent: true }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats({
          totalComplaints: statsRes.data.totalComplaints || 432,
          highSeverity: statsRes.data.highSeverityCount || 12,
          slaBreaches: statsRes.data.slaBreachCount || 5,
          resolvedToday: statsRes.data.resolvedTodayCount || 28
        });

        const trendRes = await api.get('/dashboard/trends');
        setChartData(trendRes.data || [
          { name: 'Mon', all: 24, high: 4 },
          { name: 'Tue', all: 28, high: 6 },
          { name: 'Wed', all: 42, high: 8 },
          { name: 'Thu', all: 32, high: 2 },
          { name: 'Fri', all: 56, high: 14 },
          { name: 'Sat', all: 40, high: 10 },
          { name: 'Sun', all: 22, high: 3 }
        ]);

        const complaintsRes = await api.get('/complaints?limit=5');
        setRecentComplaints(complaintsRes.data.content || []);

        const riskRes = await api.get('/risk/zones');
        setRiskZones(riskRes.data || [
          { name: 'Central Park', count: 18, score: 82, trend: 'up' },
          { name: 'Lakeside', count: 7, score: 35, trend: 'down' },
          { name: 'North District', count: 24, score: 68, trend: 'up' },
          { name: 'Industrial Belt', count: 4, score: 12, trend: 'stable' }
        ]);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchData();
  }, []);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getRiskColor = (score) => {
    if (score >= 75) return 'danger';
    if (score >= 40) return 'warning';
    return 'success';
  };

  return (
    <div className="dashboard-wrapper">
      {/* Alert Banners */}
      <div className="alerts-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-banner ${alert.type} glass`}>
            <div className="alert-content">
              <AlertCircle size={20} />
              <span>{alert.message}</span>
            </div>
            <button className="dismiss-btn" onClick={() => dismissAlert(alert.id)}>
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          title="Total Complaints" 
          value={stats.totalComplaints} 
          icon={<Layers size={24} />} 
          trend="+12%" 
          color="primary"
        />
        <KPICard 
          title="High Severity" 
          value={stats.highSeverity} 
          icon={<AlertCircle size={24} />} 
          trend="+3 today" 
          color="danger"
        />
        <KPICard 
          title="SLA Breaches" 
          value={stats.slaBreaches} 
          icon={<Clock size={24} />} 
          trend="-2% vs avg" 
          color="warning"
        />
        <KPICard 
          title="Resolved Today" 
          value={stats.resolvedToday} 
          icon={<CheckCircle2 size={24} />} 
          trend="85% rate" 
          color="success"
        />
      </div>

      <div className="dashboard-grid">
        {/* Trend Analysis */}
        <div className="dashboard-card trend-card glass-card">
          <div className="card-header">
            <h3>Complaint Trend</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot all"></span> All</span>
              <span className="legend-item"><span className="dot high"></span> High Severity</span>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1BAFBF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1BAFBF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8433A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E8433A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#7EA8B8" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#7EA8B8" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0D2240', border: '1px solid rgba(27, 175, 191, 0.22)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="all" stroke="#1BAFBF" strokeWidth={3} fillOpacity={1} fill="url(#colorAll)" />
                <Area type="monotone" dataKey="high" stroke="#E8433A" strokeWidth={3} fillOpacity={1} fill="url(#colorHigh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Index */}
        <div className="dashboard-card risk-panel glass-card">
          <div className="card-header">
            <h3>Area Risk Index</h3>
            <TrendingUp size={20} className="text-muted" />
          </div>
          <div className="risk-list">
            {riskZones.map((zone, idx) => (
              <div key={idx} className="zone-item">
                <div className="zone-info">
                  <h4>{zone.name}</h4>
                  <p>{zone.count} active reports</p>
                </div>
                <div className="zone-meta">
                   <div className={`risk-ring ${getRiskColor(zone.score)}`}>
                     {zone.score}
                   </div>
                   {zone.trend === 'up' ? <ArrowUpRight size={16} className="text-danger" /> : <ArrowDownRight size={16} className="text-success" />}
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View Detailed Risk Map</button>
        </div>
      </div>

      <div className="dashboard-card recent-complaints glass-card">
        <div className="card-header">
           <h3>Recent Complaints</h3>
           <button className="text-btn">See All</button>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Area</th>
                <th>Issue</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.length > 0 ? recentComplaints.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.area}</td>
                  <td>{c.issueType}</td>
                  <td><span className={`badge badge-${c.severity?.toLowerCase()}`}>{c.severity}</span></td>
                  <td><span className={`status-badge ${c.status?.toLowerCase()}`}>{c.status}</span></td>
                  <td>{c.riskScore}</td>
                  <td className="text-muted">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td><button className="view-btn">View</button></td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="text-center py-4">Loading complaints...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, trend, color }) => (
  <div className={`kpi-card glass-card ${color}`}>
    <div className="kpi-icon-row">
      <div className="kpi-icon">{icon}</div>
      <span className="kpi-trend">{trend}</span>
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-title">{title}</div>
  </div>
);

export default AdminDashboard;
