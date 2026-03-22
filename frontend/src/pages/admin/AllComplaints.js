import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Save
} from 'lucide-react';
import api from '../../services/api';
import './AllComplaints.css';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
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

  const updateStatus = async (id, status, remarks) => {
    setLoading(true);
    try {
      await api.put(`/complaints/${id}/status?status=${status}${remarks ? `&remarks=${encodeURIComponent(remarks)}` : ''}`);
      await fetchComplaints();
      setSelectedComplaint(null);
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-content action-driven-terminal">
      <div className="page-header-row">
         <div className="search-box glass">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Operational Search: ID, Area, Issue..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="filter-chips">
            {['All', 'HIGH', 'MEDIUM', 'LOW', 'Pending', 'In Progress', 'Resolved', 'Escalated'].map(f => (
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
                <th>Area</th>
                <th>Issue Match</th>
                <th>Severity</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? filteredComplaints.map(c => (
                <tr key={c.id}>
                  <td><span className="id-text">#{c.id}</span></td>
                  <td>{c.area}</td>
                  <td>{c.issueType}</td>
                  <td><span className={`badge badge-${c.severity.toLowerCase()}`}>{c.severity}</span></td>
                  <td><span className={`risk-val ${getRiskColor(c.riskScore)}`}>{c.riskScore}</span></td>
                  <td><span className={`status-badge ${c.status.toLowerCase().replace(' ', '-')}`}>{c.status}</span></td>
                  <td className="text-muted"><small>{c.lastUpdatedAt ? new Date(c.lastUpdatedAt).toLocaleString() : 'N/A'}</small></td>
                  <td>
                    <button className="icon-btn action-btn-trigger" onClick={() => setSelectedComplaint(c)}>
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="text-center py-8">No active operational logs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedComplaint && (
        <ActionModal 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)} 
          onUpdate={updateStatus}
          loading={loading}
        />
      )}
    </div>
  );
};

const ActionModal = ({ complaint, onClose, onUpdate, loading }) => {
  const [remarks, setRemarks] = useState(complaint.remarks || '');
  
  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card action-modal-body">
        <div className="modal-header">
           <h2>Operational Terminal <span className="text-muted">#{complaint.id}</span></h2>
           <button className="close-x" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="terminal-body scrollable">
           <div className="terminal-layout">
              <div className="terminal-params">
                 <div className="param-block"><label><MapPin size={14} /> Geographic Zone</label><span>{complaint.area} ({complaint.zone})</span></div>
                 <div className="param-block"><label><Clock size={14} /> Submission Time</label><span>{new Date(complaint.createdDate).toLocaleDateString()}</span></div>
                 <div className="param-block"><label><ShieldAlert size={14} /> Auto-Assigned Severity</label><span className={`badge badge-${complaint.severity.toLowerCase()}`}>{complaint.severity}</span></div>
                 <div className="param-block"><label>Current Status</label><span className={`status-badge ${complaint.status.toLowerCase().replace(' ', '-')}`}>{complaint.status}</span></div>
              </div>

              <div className="action-input-section">
                 <label>Admin Remarks / Field Notes</label>
                 <textarea 
                   className="remarks-textarea glass" 
                   placeholder="Enter findings, site updates or resolution notes..."
                   value={remarks}
                   onChange={(e) => setRemarks(e.target.value)}
                 ></textarea>
                 
                 <div className="status-trigger-grid">
                    <button 
                      className="btn-op progress" 
                      disabled={loading || complaint.status === 'In Progress'}
                      onClick={() => onUpdate(complaint.id, 'In Progress', remarks)}
                    >
                      Deploy In Progress
                    </button>
                    <button 
                      className="btn-op success" 
                      disabled={loading || complaint.status === 'Resolved'}
                      onClick={() => onUpdate(complaint.id, 'Resolved', remarks)}
                    >
                      Mark Resolved
                    </button>
                    <button 
                      className="btn-op danger" 
                      disabled={loading || complaint.status === 'Escalated'}
                      onClick={() => onUpdate(complaint.id, 'Escalated', remarks)}
                    >
                      Flag Escalated
                    </button>
                    <button 
                      className="btn-op save-only" 
                      disabled={loading}
                      onClick={() => onUpdate(complaint.id, complaint.status, remarks)}
                    >
                      <Save size={16} /> Save Notes Only
                    </button>
                 </div>
              </div>
           </div>

           <div className="complaint-history-strip">
              <h4>Activity Trace</h4>
              <div className="history-line">
                 <div className="history-node active">
                    <div className="node-marker"></div>
                    <div className="node-content">
                       <strong>{complaint.status}</strong>
                       <p>{complaint.remarks || "No additional field notes recorded."}</p>
                       <span>Last Synchronized: {complaint.lastUpdatedAt ? new Date(complaint.lastUpdatedAt).toLocaleString() : 'System Boot'}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AllComplaints;
