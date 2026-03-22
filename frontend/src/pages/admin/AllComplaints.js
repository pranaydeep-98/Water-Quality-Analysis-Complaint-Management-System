import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  X,
  MapPin,
  User,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import './AllComplaints.css';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints');
        setComplaints(res.data.content || [
          { id: 4398, citizen: 'John Doe', area: 'Central Park', issueType: 'Discoloration', severity: 'Medium', duplicates: 2, riskScore: 45, status: 'Open', slaStatus: 'On Track', createdAt: '2026-03-22T08:00:00' },
          { id: 4399, citizen: 'Jane Smith', area: 'North District', issueType: 'Contamination', severity: 'High', duplicates: 5, riskScore: 88, status: 'Escalated', slaStatus: 'Breached', createdAt: '2026-03-22T06:30:00' },
          { id: 4400, citizen: 'Mike Ross', area: 'Lakeside', issueType: 'Pressure', severity: 'Low', duplicates: 0, riskScore: 12, status: 'Resolved', slaStatus: 'Resolved', createdAt: '2026-03-21T15:00:00' }
        ]);
      } catch (err) {
        console.error("Failed to fetch complaints", err);
      }
    };
    fetchComplaints();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    const matchesFilter = filter === 'All' || c.severity === filter || c.status === filter;
    const matchesSearch = c.area.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getRiskColor = (score) => {
    if (score >= 75) return 'text-danger';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="admin-page-content">
      <div className="page-header-row">
         <div className="search-box glass">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Filter by ID, Area, Issue..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="filter-chips">
            {['All', 'High', 'Medium', 'Low', 'Escalated', 'Open', 'Resolved'].map(f => (
              <button 
                key={f} 
                className={`chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      <div className="table-card glass-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Citizen</th>
                <th>Area / Zone</th>
                <th>Issue Type</th>
                <th>Severity</th>
                <th>Duplicates</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? filteredComplaints.map(c => (
                <tr key={c.id}>
                  <td><span className="id-text">#{c.id}</span></td>
                  <td>{c.citizen}</td>
                  <td>{c.area}</td>
                  <td>{c.issueType}</td>
                  <td><span className={`badge badge-${c.severity.toLowerCase()}`}>{c.severity}</span></td>
                  <td>{c.duplicates}</td>
                  <td><span className={`risk-val ${getRiskColor(c.riskScore)}`}>{c.riskScore}</span></td>
                  <td><span className={`status-badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td><span className={`sla-badge ${c.slaStatus.toLowerCase().replace(' ', '-')}`}>{c.slaStatus}</span></td>
                  <td>
                    <button className="icon-btn" onClick={() => setSelectedComplaint(c)}>
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="10" className="text-center py-8">No complaints found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedComplaint && (
        <DetailModal 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)} 
        />
      )}
    </div>
  );
};

const DetailModal = ({ complaint, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content glass" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
         <h2>Complaint Details <span className="text-muted">#{complaint.id}</span></h2>
         <button className="close-x" onClick={onClose}><X size={24} /></button>
      </div>
      
      <div className="modal-body scrollable">
         <div className="detail-grid">
            <div className="detail-info">
               <div className="info-block">
                  <label><User size={14} /> Citizen</label>
                  <span>{complaint.citizen}</span>
               </div>
               <div className="info-block">
                  <label><MapPin size={14} /> Location</label>
                  <span>{complaint.area}</span>
               </div>
               <div className="info-block">
                  <label><Clock size={14} /> Registered At</label>
                  <span>{new Date(complaint.createdAt).toLocaleString()}</span>
               </div>
            </div>
            
            <div className="risk-breakdown-card glass">
               <label>Risk Score Analysis</label>
               <div className="risk-display">
                  <span className="score-num">{complaint.riskScore}</span>
                  <div className="risk-bar-bg">
                     <div className="risk-bar-fill" style={{ width: `${complaint.riskScore}%` }}></div>
                  </div>
               </div>
               <p className="text-small">Composite score based on severity, volume and age.</p>
            </div>
         </div>

         <div className="timeline-section">
            <h3>Activity Log</h3>
            <div className="timeline">
               <div className="timeline-item done">
                  <div className="t-icon"><CheckCircle size={16} /></div>
                  <div className="t-text">
                     <strong>Registered</strong>
                     <span>Complaint received and queued.</span>
                  </div>
               </div>
               <div className="timeline-item active">
                  <div className="t-icon"><AlertTriangle size={16} /></div>
                  <div className="t-text">
                     <strong>Assigned</strong>
                     <span>Pending officer assignment.</span>
                  </div>
               </div>
               <div className="timeline-item">
                  <div className="t-icon"><Clock size={16} /></div>
                  <div className="t-text">
                     <strong>In Progress</strong>
                     <span>Awaiting site sampling results.</span>
                  </div>
               </div>
               <div className="timeline-item">
                  <div className="t-icon"><CheckCircle size={16} /></div>
                  <div className="t-text">
                     <strong>Resolved</strong>
                     <span>Resolution confirmation pending.</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="modal-actions">
         <button className="btn-action primary">Assign Officer</button>
         <button className="btn-action secondary">Escalate</button>
         <button className="btn-action success">Mark Resolved</button>
      </div>
    </div>
  </div>
);

export default AllComplaints;
