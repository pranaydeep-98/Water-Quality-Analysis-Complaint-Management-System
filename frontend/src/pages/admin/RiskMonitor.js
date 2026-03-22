import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Layers,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import './RiskMonitor.css';

const RiskMonitor = () => {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const res = await api.get('/admin/risk-scores');
        setZones(res.data || []);
      } catch (err) {
        console.error("Failed to fetch risk data", err);
      }
    };
    fetchRiskData();
  }, []);

  const getRiskLevel = (count) => {
    if (count >= 5) return { label: 'CRITICAL', class: 'critical', score: 90 };
    if (count >= 3) return { label: 'HIGH', class: 'warning', score: 70 };
    return { label: 'LOW', class: 'safe', score: 20 + (count * 10) };
  };

  return (
    <div className="admin-page-content risk-monitor-simple">
      <div className="section-header-banner glass-card">
         <div className="banner-icon"><ShieldAlert size={32} /></div>
         <div className="banner-text">
            <h2>Geographic Risk Monitor</h2>
            <p>System-generated risk scores based on report clusters and severity density.</p>
         </div>
      </div>

      <div className="risk-grid">
         {zones.sort((a,b) => b.count - a.count).map((zone, idx) => {
           const risk = getRiskLevel(zone.count);
           return (
             <div key={idx} className={`risk-card-item glass-card ${risk.class}`}>
                <div className="risk-header">
                   <div className="area-info">
                      <MapPin size={18} />
                      <span className="area-name">{zone.area}</span>
                   </div>
                   <span className={`risk-badge ${risk.class}`}>{risk.label}</span>
                </div>
                
                <div className="risk-body">
                   <div className="metric-row">
                      <label>Report Density</label>
                      <div className="metric-val">{zone.count} Active Logs</div>
                   </div>
                   <div className="risk-score-display">
                      <div className="score-label">Risk Index</div>
                      <div className="score-num">{risk.score}</div>
                   </div>
                   <div className="progress-container">
                      <div className="progress-fill" style={{ width: `${risk.score}%` }}></div>
                   </div>
                </div>

                {risk.label === 'CRITICAL' && (
                  <div className="risk-footer alert">
                     <AlertTriangle size={14} />
                     <span>Immediate Site Action Required</span>
                  </div>
                )}
             </div>
           );
         })}
         
         {zones.length === 0 && (
           <div className="empty-state-full glass-card">
              <Layers size={48} />
              <p>No geographic clusters detected. System scanning active...</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default RiskMonitor;
