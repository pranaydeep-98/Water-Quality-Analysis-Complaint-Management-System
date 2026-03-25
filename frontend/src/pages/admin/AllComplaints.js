import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './AllComplaints.css';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

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

  const handleUpdateSuccess = (updatedComplaint) => {
    setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c));
    if (selectedComplaint && selectedComplaint.id === updatedComplaint.id) {
        setSelectedComplaint({ ...selectedComplaint, ...updatedComplaint });
    }
  };

  const handleQuickAction = async (complaint, status) => {
    if (status === 'Resolved') {
      if (!window.confirm("Are you sure you want to mark this as Resolved?")) return;
    }

    try {
      const res = await api.put(`/complaints/${complaint.id}/status`, {
        status,
        remarks: `Quick Action: ${status} initiated by admin.`
      });
      showToast(res.data?.message || `Complaint #${complaint.id} updated to ${status}`, status === 'Escalated' ? 'warning' : 'success');
      handleUpdateSuccess({ ...complaint, status, lastUpdatedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Action error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Server error";
      showToast("Operation failed: " + errorMessage, "error");
    }
  };

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
                <th>Citizen Name</th>
                <th>Phone</th>
                <th>Area / Zone</th>
                <th>Issue Type</th>
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
                  <td>{c.citizenName || 'Unknown'}</td>
                  <td>{c.phoneNumber || 'N/A'}</td>
                  <td>{c.area} {c.zone ? `(${c.zone})` : ''}</td>
                  <td>
                    {c.issueType}
                    {c.duplicateCount > 0 && (
                        <span className="duplicate-badge">
                            {c.duplicateCount} duplicate{c.duplicateCount > 1 ? 's' : ''}
                        </span>
                    )}
                  </td>
                  <td><span className={`badge badge-${c.severity?.toLowerCase()}`}>{c.severity}</span></td>
                  <td><span className={`risk-val ${getRiskColor(c.riskScore)}`}>{c.riskScore}</span></td>
                  <td><span className={`status-badge ${c.status?.toLowerCase().replace(' ', '-')}`}>{c.status}</span></td>
                  <td className="text-muted"><small>{c.lastUpdatedAt ? new Date(c.lastUpdatedAt).toLocaleString() : 'N/A'}</small></td>
                  <td>
                    <div className="quick-actions-flex">
                      {c.status === 'Pending' && (
                        <button className="icon-btn progress-btn" title="Deploy In Progress" onClick={() => handleQuickAction(c, 'In Progress')}>
                          <Play size={16} />
                        </button>
                      )}
                      {(c.status === 'Pending' || c.status === 'In Progress' || c.status === 'Escalated') && (
                        <button className="icon-btn success-btn" title="Mark Resolved" onClick={() => handleQuickAction(c, 'Resolved')}>
                          <Check size={16} />
                        </button>
                      )}
                      {(c.status === 'Pending' || c.status === 'In Progress') && (
                        <button className="icon-btn danger-btn" title="Flag Escalated" onClick={() => handleQuickAction(c, 'Escalated')}>
                          <AlertTriangle size={16} />
                        </button>
                      )}
                      <button className="icon-btn action-btn-trigger" title="View Details" onClick={() => setSelectedComplaint(c)}>
                        <Eye size={18} />
                      </button>
                    </div>
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
          onUpdateSuccess={handleUpdateSuccess}
          refreshList={fetchComplaints}
        />
      )}
    </div>
  );
};

const ActionModal = ({ complaint, onClose, onUpdateSuccess, refreshList }) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const { showToast } = useToast();

  const fetchActivities = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.id}/activities`);
      setActivities(res.data || []);
    } catch (err) {
      console.error("Failed to fetch activities");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchActivities();
  }, [complaint.id]);

  const performAction = async (status) => {
    if (status === 'Resolved') {
      if (!window.confirm("Are you sure you want to mark this as Resolved?")) return;
    }

    setLoading(true);
    try {
      // Using the more robust status endpoint with JSON body
      const res = await api.put(`/complaints/${complaint.id}/status`, {
        status,
        remarks: `Action: ${status} initiated by admin.`
      });
      
      const successMessage = res.data?.message || `Complaint #${complaint.id} updated to ${status}`;
      showToast(successMessage, status === 'Escalated' ? 'warning' : 'success');

      // Update local state and parent
      await fetchActivities();
      if (refreshList) await refreshList();
      
      // Update the complaint object passed to modal to reflect status change for button rules
      onUpdateSuccess({ ...complaint, status, lastUpdatedAt: new Date().toISOString() });

    } catch (err) {
      console.error("Action error:", err);
      const errorMessage = err.response?.data?.message 
        || (typeof err.response?.data === 'string' ? err.response.data : null)
        || err.response?.statusText 
        || err.message 
        || "Server error";
      showToast("Operation failed: " + errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const status = complaint.status;

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
                 <div className="citizen-details-block">
                   <h4>👤 Citizen Details</h4>
                   <div className="detail-row">
                     <span className="detail-label">Name</span>
                     <span className="detail-value">{complaint.citizenName || 'Unknown'}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Phone</span>
                     <span className="detail-value">{complaint.phoneNumber || 'N/A'}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Area</span>
                     <span className="detail-value">{complaint.area}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Zone</span>
                     <span className="detail-value">{complaint.zone || 'N/A'}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Deadline</span>
                     <span className="detail-value" style={{color: complaint.deadline && new Date(complaint.deadline) < new Date() && complaint.status !== 'Resolved' ? 'red' : 'green'}}>
                       {complaint.deadline || 'N/A'}
                     </span>
                   </div>
                 </div>
                 <div style={{marginTop: '15px'}}>
                   <div className="param-block"><label><ShieldAlert size={14} /> Auto-Assigned Severity</label><span className={`badge badge-${complaint.severity?.toLowerCase()}`}>{complaint.severity}</span></div>
                   <div className="param-block"><label>Current Status</label><span className={`status-badge ${status?.toLowerCase().replace(' ', '-')}`}>{status}</span></div>
                 </div>
              </div>

              <div className="action-input-section">
                 <div className="status-trigger-grid">
                    {status === 'Pending' && (
                       <>
                         <button className="btn-op progress" disabled={loading} onClick={() => performAction('In Progress')}><Play size={16} /> Deploy In Progress</button>
                         <button className="btn-op success" disabled={loading} onClick={() => performAction('Resolved')}><CheckCircle size={16} /> Mark Resolved</button>
                         <button className="btn-op danger" disabled={loading} onClick={() => performAction('Escalated')}><AlertTriangle size={16} /> Flag Escalated</button>
                       </>
                    )}

                    {status === 'In Progress' && (
                       <>
                         <button className="btn-op success" disabled={loading} onClick={() => performAction('Resolved')}><CheckCircle size={16} /> Mark Resolved</button>
                         <button className="btn-op danger" disabled={loading} onClick={() => performAction('Escalated')}><AlertTriangle size={16} /> Flag Escalated</button>
                       </>
                    )}

                    {status === 'Escalated' && (
                       <button className="btn-op success" disabled={loading} onClick={() => performAction('Resolved')}><CheckCircle size={16} /> Mark Resolved</button>
                    )}

                    {status === 'Resolved' && (
                       <div className="resolved-confirmation glass">
                          <CheckCircle className="text-success" size={20} />
                          <span>This complaint has been successfully resolved and closed.</span>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="complaint-history-strip">
              <h4><Activity size={18} /> Activity Trace</h4>
              <div className="history-line">
                 {activities.map((act, index) => (
                    <div key={act.id} className={`history-node ${index === 0 ? 'active' : ''} node-${act.status.toLowerCase().replace(' ', '-')}`}>
                       <div className="node-marker"></div>
                       <div className="node-content">
                          <strong>{act.status}</strong>
                          <p>{act.description}</p>
                          <span>{new Date(act.createdAt).toLocaleString()}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AllComplaints;
