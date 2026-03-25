import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Clock, 
  Activity, 
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Loader2,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import './MyComplaintsPage.css';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUserComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/complaints/user');
      setComplaints(response.data || []);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserComplaints();
  }, []);

  const handleView = async (id) => {
    setModalLoading(true);
    setSelectedComplaint({ id, loading: true });
    try {
      // Fetch fresh complaint and its activities
      const [compRes, activeRes] = await Promise.all([
        api.get(`/complaints/${id}/activities`), // This was missing a single complaint getter, but I'll use activities for trace
      ]);
      
      const found = complaints.find(c => c.id === id);
      setSelectedComplaint({ ...found, activities: activeRes.data });
    } catch (err) {
      console.error("Failed to load details", err);
      const found = complaints.find(c => c.id === id);
      setSelectedComplaint(found);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'All') return true;
    return c.status === filter;
  });

  const getStatusClass = (status) => {
    if(!status) return 'status-gray';
    if(status === 'Pending') return 'status-gold';
    if(status === 'In Progress') return 'status-blue';
    if(status === 'Resolved') return 'status-green';
    if(status === 'Escalated' || status === 'Overdue') return 'status-red';
    return 'status-gray';
  };

  return (
    <div className="my-complaints-container">
      <div className="header-row">
        <div className="title-group">
          <h1>My Operational Logs</h1>
          <p>Real-time status tracking and history of your submitted water quality incidents.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/user/submit')}>
            <PlusCircle size={18} /> New Complaint
        </button>
      </div>

      <div className="complaints-collection">
         <div className="controls-row glass-card">
            <div className="filter-group">
               <label><Filter size={16} /> Operational Filter:</label>
               <div className="filter-chips">
                  {['All', 'Pending', 'In Progress', 'Resolved', 'Escalated'].map(f => (
                    <button 
                      key={f}
                      className={filter === f ? 'chip active' : 'chip'} 
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         {loading ? (
           <div className="loader-container"><Loader2 size={40} className="spinner" /> Synchronizing data...</div>
         ) : filteredComplaints.length > 0 ? (
           <div className="table-responsive glass-card">
              <table className="user-table">
                 <thead>
                    <tr>
                       <th>ID</th>
                       <th>Area</th>
                       <th>Issue Type</th>
                       <th>Severity</th>
                       <th>Status</th>
                       <th>Created On</th>
                       <th>Deadline</th>
                       <th>Tracking</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredComplaints.map(c => (
                      <tr key={c.id}>
                         <td className="id-cell">#{c.id}</td>
                         <td>{c.area}</td>
                         <td>{c.issueType}</td>
                         <td>
                            <span className={`badge badge-${c.severity.toLowerCase()}`}>{c.severity}</span>
                         </td>
                         <td>
                            <span className={`status-badge ${getStatusClass(c.status)}`}>{c.status}</span>
                         </td>
                         <td>{new Date(c.createdDate).toLocaleDateString()}</td>
                         <td>{c.deadline ? new Date(c.deadline).toLocaleDateString() : 'N/A'}</td>
                         <td>
                            <button className="btn-track" onClick={() => handleView(c.id)}>
                               <Activity size={18} />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
         ) : (
           <div className="empty-state glass-card">
              <div className="icon-empty"><Activity size={48} /></div>
              <h3>No Logs Found</h3>
              <p>You haven't reported any incidents yet. All your filed reports will appear here for real-time tracking.</p>
              <button className="btn-primary" onClick={() => navigate('/user/submit')}>File First Report</button>
           </div>
         )}
      </div>

      {selectedComplaint && (
        <DetailModal 
          complaint={selectedComplaint} 
          loading={modalLoading}
          onClose={() => setSelectedComplaint(null)} 
        />
      )}
    </div>
  );
};

const DetailModal = ({ complaint, loading, onClose }) => {
  const getStatusClass = (status) => {
    if(!status) return 'status-gray';
    if(status === 'Pending') return 'status-gold';
    if(status === 'In Progress') return 'status-blue';
    if(status === 'Resolved') return 'status-green';
    if(status === 'Escalated') return 'status-red';
    return 'status-gray';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-card glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
           <div className="title-group">
              <span className="id-label">LOG ENTRY #{complaint.id}</span>
              <h2>Tracking History</h2>
           </div>
           <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-scrollable">
           {loading || complaint.loading ? (
             <div className="loader-container p-4"><Loader2 size={32} className="spinner" /></div>
           ) : (
             <div className="tracking-modal-content">
               <div className="status-hero glass-mini">
                  <div className="hero-stat">
                     <label>Current Status</label>
                     <span className={`status-badge ${getStatusClass(complaint.status)} inline`}>{complaint.status}</span>
                  </div>
                  <div className="hero-stat">
                     <label>Point of Contact Area</label>
                     <span>{complaint.area}</span>
                  </div>
                  <div className="hero-stat">
                     <label>Resolution SLA</label>
                     <span className={new Date(complaint.deadline) < new Date() ? 'text-danger' : ''}>{new Date(complaint.deadline).toLocaleDateString()}</span>
                  </div>
               </div>

               <div className="activity-trace-section mt-6">
                  <h3 className="section-title"><Activity size={18} /> Activity Timeline</h3>
                  <div className="user-activity-line">
                     {complaint.activities?.length > 0 ? complaint.activities.map((act, idx) => (
                        <div key={act.id} className={`user-node ${idx === 0 ? 'active' : ''}`}>
                           <div className="node-marker"></div>
                           <div className="node-body">
                              <div className="node-head">
                                 <strong>{act.status}</strong>
                                 <span>{new Date(act.createdAt).toLocaleString()}</span>
                              </div>
                              <p>{act.description}</p>
                           </div>
                        </div>
                     )) : (
                        <div className="empty-trace">Initializing trace...</div>
                     )}
                  </div>
               </div>
             </div>
           )}
        </div>
        
        <div className="modal-footer">
           <button className="btn-secondary" onClick={onClose}>Close Terminal</button>
        </div>
      </div>
    </div>
  );
};

export default MyComplaintsPage;
