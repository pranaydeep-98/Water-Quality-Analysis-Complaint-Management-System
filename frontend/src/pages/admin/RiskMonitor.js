import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import './RiskMonitor.css';

const RiskMonitor = () => {
  const [riskData] = useState({
    critical: 2,
    high: 5,
    moderate: 8,
    safe: 15
  });
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const res = await api.get('/risk/zones');
        const data = res.data || [
          { name: 'Central Park', score: 82, count: 18, trend: 'up', severity: 75, duplicates: 85, delay: 65 },
          { name: 'North District', score: 68, count: 24, trend: 'up', severity: 55, duplicates: 60, delay: 90 },
          { name: 'Lakeside', score: 35, count: 7, trend: 'down', severity: 25, duplicates: 30, delay: 50 },
          { name: 'Industrial Belt', score: 12, count: 4, trend: 'stable', severity: 10, duplicates: 15, delay: 10 }
        ];
        setZones(data);
        if (data.length > 0) setSelectedZone(data[0]);
      } catch (err) {
        console.error("Failed to fetch risk data", err);
      }
    };
    fetchRiskData();
  }, []);

  const getRiskClass = (score) => {
    if (score >= 75) return 'critical';
    if (score >= 40) return 'warning';
    return 'safe';
  };

  return (
    <div className="admin-page-content risk-monitor">
      <div className="kpi-grid four">
        <RiskCard title="Critical Zones" value={riskData.critical} color="red" />
        <RiskCard title="High Risk" value={riskData.high} color="orange" />
        <RiskCard title="Moderate Risk" value={riskData.moderate} color="gold" />
        <RiskCard title="Safe Zones" value={riskData.safe} color="green" />
      </div>

      <div className="risk-layout">
        <div className="zone-risk-list glass-card">
           <div className="section-header">
              <h2>Zone Risk Hierarchy</h2>
              <Layers size={18} className="text-muted" />
           </div>
           
           <div className="zone-items scrollable">
              {zones.map((zone, idx) => (
                <div 
                  key={idx} 
                  className={`zone-item glass-mini ${selectedZone?.name === zone.name ? 'active' : ''}`}
                  onClick={() => setSelectedZone(zone)}
                >
                   <div className={`risk-ring ${getRiskClass(zone.score)}`}>
                      {zone.score}
                   </div>
                   <div className="zone-info">
                      <h3>{zone.name}</h3>
                      <p>{zone.count} active reports</p>
                   </div>
                   <div className="zone-trend">
                      {zone.trend === 'up' ? <TrendingUp size={18} className="text-danger" /> : <TrendingDown size={18} className="text-success" />}
                   </div>
                   <ArrowRight size={16} className="arrow-next" />
                </div>
              ))}
           </div>
        </div>

        <div className="risk-analysis-view">
           {selectedZone ? (
             <div className="analysis-card glass-card">
                <div className="analysis-header">
                   <div className="title-row">
                      <MapPin size={24} className="text-primary" />
                      <h2>{selectedZone.name} Risk Analysis</h2>
                   </div>
                   <div className={`aggregate-score ${getRiskClass(selectedZone.score)}`}>
                      <span className="label">Composite Index</span>
                      <span className="value">{selectedZone.score}</span>
                   </div>
                </div>

                <div className="breakdown-grid">
                   <WeightBar label="Severity Weight" value={selectedZone.severity} color="var(--high-sev)" />
                   <WeightBar label="Duplicate Weight" value={selectedZone.duplicates} color="var(--medium-sev)" />
                   <WeightBar label="Delay Factor Weight" value={selectedZone.delay} color="var(--warning)" />
                </div>

                <div className="summary-section glass">
                   <h3>Automated Insight</h3>
                   <p>The risk index in <strong>{selectedZone.name}</strong> is primarily driven by <strong>{selectedZone.duplicates > 70 ? 'high report clusters' : 'complaint resolution delays'}</strong>. Critical intervention recommended for zone grid #422.</p>
                </div>

                <button className="btn-primary full-width">Deploy Site samples</button>
             </div>
           ) : (
             <div className="empty-selection glass-card">Select a zone to view detailed risk breakdown.</div>
           )}
        </div>
      </div>
    </div>
  );
};

const RiskCard = ({ title, value, color }) => (
  <div className={`kpi-card glass-card risk-${color}`}>
    <div className="kpi-icon-row">
       <div className={`kpi-icon ${color}`}>
          <ShieldAlert size={24} />
       </div>
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-title">{title}</div>
  </div>
);

const WeightBar = ({ label, value, color }) => (
  <div className="weight-item">
     <div className="weight-header">
        <label>{label}</label>
        <span>{value}%</span>
     </div>
     <div className="bar-bg">
        <div className="bar-fill" style={{ width: `${value}%`, background: color }}></div>
     </div>
  </div>
);

export default RiskMonitor;
