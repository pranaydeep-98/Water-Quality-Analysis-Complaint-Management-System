import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  X,
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
import { useLocation } from 'react-router-dom';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [highlightId, setHighlightId] = useState(null);
  const { showToast } = useToast();
  const location = useLocation();

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

  // Handle highlight from URL (for notification clicking)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hId = params.get('highlight');
    if (hId && complaints.length > 0) {
      setHighlightId(parseInt(hId));
      setTimeout(() => {
        const el = document.getElementById(`complaint-row-${hId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [location.search, complaints]);

  const handleUpdateSuccess = (updatedComplaint) => {
    setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c));
    if (selectedComplaint && selectedComplaint.id === updatedComplaint.id) {
        setSelectedComplaint({ ...selectedComplaint, ...updatedComplaint });
    }
  };

  const handleQuickAction = async (complaint, status, source = 'Quick Action') => {
    if (status === 'Resolved') {
      if (!window.confirm("Are you sure you want to mark this as Resolved?")) return;
    }

    try {
      const res = await api.put(`/complaints/${complaint.id}/status`, {
        status,
        remarks: `${source}: ${status} initiated by admin.`
      });
      showToast(res.data?.message || `Complaint #${complaint.id} updated to ${status}`, 'success');
      handleUpdateSuccess({ ...complaint, status, lastUpdatedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Action error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Server error";
      showToast("Operation failed: " + errorMessage, "error");
    }
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSLAStatus = (complaint) => {
    if (complaint.status === 'Resolved') return { label: 'Met', class: 'sla-met', isBreached: false };
    if (!complaint.deadline) return { label: 'On Track', class: 'sla-track', isBreached: false };
    const over = new Date() > new Date(complaint.deadline);
    return over 
      ? { label: 'Breached', class: 'sla-breached', isBreached: true } 
      : { label: 'On Track', class: 'sla-track', isBreached: false };
  };

  const filteredComplaints = complaints
    .filter(c => {
      const matchesFilter = filter === 'All' || c.severity === filter || c.status === filter;
      const matchesSearch = c.area.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.id.toString().includes(searchTerm);
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // MANDATORY: Priority sorting - Breached DESC, then riskScore DESC
      const slaA = getSLAStatus(a).isBreached ? 1 : 0;
      const slaB = getSLAStatus(b).isBreached ? 1 : 0;
      
      if (slaA !== slaB) return slaB - slaA;
      
      // Secondary sorting by riskScore (unless user clicked a header)
      if (sortConfig.key === 'id') {
         // Default sort when no specific sort is picked
         return b.riskScore - a.riskScore; 
      }

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
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
            {['All', 'HIGH', 'MEDIUM', 'LOW', 'Pending', 'In Progress', 'Resolved'].map(f => (
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
                <th onClick={() => requestSort('id')} className="sortable">ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th>Citizen Name</th>
                <th>Phone</th>
                <th>Area / Zone</th>
                <th>Issue Type / Duplicates</th>
                <th>Severity</th>
                <th onClick={() => requestSort('riskScore')} className="sortable">Risk Score {sortConfig.key === 'riskScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => requestSort('duplicateCount')} className="sortable">Unique Reporters {sortConfig.key === 'duplicateCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? filteredComplaints.map(c => {
                const sla = getSLAStatus(c);
                const isHighlighted = highlightId === c.id;
                return (
                  <tr 
                    key={c.id} 
                    id={`complaint-row-${c.id}`}
                    className={`${sla.isBreached ? 'breached-row' : ''} ${isHighlighted ? 'highlight-active' : ''}`}
                  >
                    <td><span className="id-text">#{c.id}</span></td>
                    <td>{c.citizenName || 'Unknown'}</td>
                    <td>{c.phoneNumber || 'N/A'}</td>
                    <td>{c.area} {c.zone ? `(${c.zone})` : ''}</td>
                    <td>
                      <div className="issue-cell">
                        <span>{c.issueType}</span>
                        {c.duplicateCount > 1 && (
                            <span className="duplicate-badge">
                                {c.duplicateCount} reporting
                            </span>
                        )}
                        {c.repeatUser && <span className="repeat-badge">Repeat Submission</span>}
                        {sla.isBreached && <span className="breached-label">⚠ BREACHED – ACTION REQUIRED</span>}
                      </div>
                    </td>
                    <td><span className={`badge badge-${c.severity?.toLowerCase()}`}>{c.severity}</span></td>
                    <td><span className={`risk-val ${getRiskColor(c.riskScore)}`}>{c.riskScore}</span></td>
                    <td className="text-center">{c.duplicateCount}</td>
                    <td><span className={`status-badge ${c.status?.toLowerCase().replace(' ', '-')}`}>{c.status}</span></td>
                    <td><span className={`sla-badge ${sla.class}`}>{sla.label}</span></td>
                    <td>
                      <div className="quick-actions-flex">
                        {sla.isBreached && c.status !== 'Resolved' ? (
                          <div className="breached-actions">
                             <button className="btn-resolve-now" onClick={() => handleQuickAction(c, 'Resolved', 'SLA Critical')}>
                               <Check size={14} /> Resolve Now
                             </button>
                             <button className="btn-reassign" onClick={() => handleQuickAction(c, 'Escalated', 'SLA Reassign')}>
                               <AlertTriangle size={14} /> Reassign
                             </button>
                          </div>
                        ) : (
                          <>
                            {c.status === 'Pending' && (
                              <button className="icon-btn progress-btn" title="Deploy In Progress" onClick={() => handleQuickAction(c, 'In Progress')}>
                                <Play size={16} />
                              </button>
                            )}
                            {(c.status === 'Pending' || c.status === 'In Progress') && (
                              <button className="icon-btn success-btn" title="Mark Resolved" onClick={() => handleQuickAction(c, 'Resolved')}>
                                <Check size={16} />
                              </button>
                            )}
                          </>
                        )}
                        <button className="icon-btn action-btn-trigger" title="View Details" onClick={() => setSelectedComplaint(c)}>
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="11" className="text-center py-8">No active operational logs.</td></tr>
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

  useEffect(() => {
    fetchActivities();
  }, [complaint.id]);

  const performAction = async (status) => {
    if (status === 'Resolved') {
      if (!window.confirm("Are you sure you want to mark this as Resolved?")) return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/complaints/${complaint.id}/status`, {
        status,
        remarks: `Action: ${status} initiated by admin.`
      });
      
      const successMessage = res.data?.message || `Complaint #${complaint.id} updated to ${status}`;
      showToast(successMessage, 'success');

      await fetchActivities();
      if (refreshList) await refreshList();
      onUpdateSuccess({ ...complaint, status, lastUpdatedAt: new Date().toISOString() });

    } catch (err) {
      console.error("Action error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Server error";
      showToast("Operation failed: " + errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

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
                      <span className="detail-label">Deadline</span>
                      <span className="detail-value" style={{color: complaint.deadline && new Date(complaint.deadline) < new Date() && complaint.status !== 'Resolved' ? 'red' : 'green'}}>
                        {complaint.deadline || 'N/A'}
                      </span>
                    </div>
                 </div>
                 <div style={{marginTop: '15px'}}>
                    <div className="param-block"><label><ShieldAlert size={14} /> Severity</label><span className={`badge badge-${complaint.severity?.toLowerCase()}`}>{complaint.severity}</span></div>
                    <div className="param-block"><label>Status</label><span className={`status-badge ${complaint.status?.toLowerCase().replace(' ', '-')}`}>{complaint.status}</span></div>
                 </div>
              </div>

              <div className="action-input-section">
                 <div className="status-trigger-grid">
                    {complaint.status !== 'Resolved' && (
                       <>
                         <button className="btn-op progress" disabled={loading} onClick={() => performAction('In Progress')}><Play size={16} /> Deploy Staff</button>
                         <button className="btn-op success" disabled={loading} onClick={() => performAction('Resolved')}><CheckCircle size={16} /> Mark Resolved</button>
                         <button className="btn-op danger" disabled={loading} onClick={() => performAction('Escalated')}><ShieldAlert size={16} /> Escalate</button>
                       </>
                    )}

                    {complaint.status === 'Resolved' && (
                       <div className="resolved-confirmation glass">
                          <CheckCircle className="text-success" size={20} />
                          <span>This complaint has been resolved.</span>
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
