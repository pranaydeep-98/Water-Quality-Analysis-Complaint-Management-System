import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Layers, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import api from '../../services/api';
import './TrendAnalysis.css';

const TrendAnalysis = () => {
  const [severityData, setSeverityData] = useState([]);
  const [issueData, setIssueData] = useState([]);
  const [resolutionRate, setResolutionRate] = useState(78);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const res = await api.get('/trends');
        setSeverityData(res.data.severity || [
          { name: 'High', value: 35, color: '#E8433A' },
          { name: 'Medium', value: 45, color: '#F6921E' },
          { name: 'Low', value: 20, color: '#2DDBB4' }
        ]);
        setIssueData(res.data.issues || [
          { name: 'Contamination', value: 42 },
          { name: 'Low Pressure', value: 38 },
          { name: 'Pipe Leakage', value: 25 },
          { name: 'Discoloration', value: 18 },
          { name: 'Billing', value: 12 }
        ]);
        setResolutionRate(res.data.resolutionRate || 78);
      } catch (err) {
        console.error("Failed to fetch trend data", err);
      }
    };
    fetchTrendData();
  }, []);

  return (
    <div className="admin-page-content trend-analysis">
      <div className="trend-top-row">
        <div className="analysis-card pie-card glass-card">
           <div className="card-header">
              <h2>Severity Distribution</h2>
              <Layers size={18} className="text-muted" />
           </div>
           
           <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0D2240', border: '1px solid rgba(27, 175, 191, 0.22)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pie-legend">
                 {severityData.map((item, idx) => (
                   <div key={idx} className="legend-item">
                      <span className="dot" style={{ background: item.color }}></span>
                      <span className="label">{item.name}</span>
                      <span className="val">{item.value}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="analysis-card resolution-card glass-card">
           <div className="card-header">
              <h2>Resolution Efficiency</h2>
              <TrendingUp size={18} className="text-muted" />
           </div>

           <div className="res-content">
              <div className="rate-circle-stats">
                 <span className="rate-num">{resolutionRate}%</span>
                 <span className="rate-label">Overall Rate</span>
              </div>
              
              <div className="progress-stack">
                 <div className="progress-item">
                    <label>Average TAT (Turnaround Time)</label>
                    <div className="bar-row">
                       <div className="bar-bg mini"><div className="bar-fill" style={{ width: '65%', background: 'var(--primary)' }}></div></div>
                       <span>18.4 hrs</span>
                    </div>
                 </div>
                 <div className="progress-item">
                    <label>Resolution Consistency</label>
                    <div className="bar-row">
                       <div className="bar-bg mini"><div className="bar-fill" style={{ width: '82%', background: 'var(--low-sev)' }}></div></div>
                       <span>92%</span>
                    </div>
                 </div>
              </div>

              <div className="res-stats-row">
                 <div className="stat-p">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>284 Solved</span>
                 </div>
                 <div className="stat-p">
                    <Clock size={16} className="text-warning" />
                    <span>12 Pending</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="analysis-card issue-distribution glass-card">
         <div className="card-header">
            <h2>Incident Category Prevalence</h2>
            <Activity size={18} className="text-muted" />
         </div>

         <div className="chart-container wide">
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={issueData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#7EA8B8" fontSize={12} width={100} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(27, 175, 191, 0.05)' }}
                    contentStyle={{ background: '#0D2240', border: '1px solid rgba(27, 175, 191, 0.22)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="url(#blueGradient)" radius={[0, 4, 4, 0]} barSize={20} />
                  <defs>
                     <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1BAFBF" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#1BAFBF" stopOpacity={0.9} />
                     </linearGradient>
                  </defs>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
