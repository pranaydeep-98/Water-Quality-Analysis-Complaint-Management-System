import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  MapPin, 
  Clock, 
  Activity, 
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Loader2
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

  useEffect(() => {
    const fetchUserComplaints = async () => {
      setLoading(true);
      try {
        const response = await api.get('/user/complaints');
        setComplaints(response.data.content || response.data || [
          { id: 4398, issueType: 'Water contamination', area: 'Block A Hostel', severity: 'HIGH', status: 'Pending', createdDate: '2026-03-20', deadline: '2026-03-22' },
          { id: 4312, issueType: 'Low pressure', area: 'Lakeside', severity: 'LOW', status: 'In Progress', createdDate: '2026-03-19', deadline: '2026-03-26' },
          { id: 4255, issueType: 'Leakage', area: 'Library', severity: 'MEDIUM', status: 'Resolved', createdDate: '2026-03-15', deadline: '2026-03-19' },
          { id: 4210, issueType: 'No water supply', area: 'Academic Block', severity: 'HIGH', status: 'Overdue', createdDate: '2026-03-10', deadline: '2026-03-12' }
        ]);
      } catch (err) {
        console.error("Failed to fetch complaints", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserComplaints();
  }, []);

  const handleView = async (id) => {
    setModalLoading(true);
    try {
      // Create a temporary object to show while loading
      setSelectedComplaint({ id, loading: true });
      const res = await api.get(`/complaints/${id}`);
      setSelectedComplaint(res.data);
    } catch (err) {
      console.error("Failed to load details", err);
      // Fallback for demonstration if endpoint isn't fully ready
      const found = complaints.find(c => c.id === id);
      if (found) {
        setSelectedComplaint({ ...found, description: 'Description details fetched from server...' });
      } else {
         setSelectedComplaint(null);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'All') return true;
    return c.status === filter;
  });

  const getSeverityClass = (sev) => {
    if(!sev) return 'safe';
    const s = sev.toUpperCase();
    if(s==='HIGH') return 'high-sev';
    if(s==='MEDIUM') return 'warning';
    return 'safe';
  };

  const getStatusClass = (status) => {
    if(!status) return 'status-gray';
    const s = status.toUpperCase();
    if(s==='PENDING') return 'status-gold';
    if(s==='IN PROGRESS') return 'status-blue';
    if(s==='RESOLVED') return 'status-green';
    if(s==='OVERDUE') return 'status-red';
    return 'status-gray';
  };

  return (
    <div className="my-complaints-container">
      <div className="header-row">
        <div className="title-group">
          <h1>My Complaints</h1>
          <p>Track the progress and history of all complaints filed by you.</p>
        </div>
      </div>

      <div className="complaints-collection">
         <div className="controls-row glass-card">
            <div className="filter-group">
               <label><Filter size={16} /> Status Filter:</label>
               <div className="filter-chips">
                  {['All', 'Pending', 'In Progress', 'Resolved', 'Overdue'].map(f => (
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
            <button className="btn-primary" onClick={() => navigate('/user/submit')}>
               <PlusCircle size={18} /> New Report
            </button>
         </div>

         {loading ? (
           <div className="loader-container"><Loader2 size={40} className="spinner" /> Analyzing records...</div>
         ) : filteredComplaints.length > 0 ? (
           <div className="table-responsive glass-card">
              <table className="user-table">
                 <thead>
                    <tr>
                       <th>ID</th>
                       <th>Area</th>
                       <th>Zone</th>
                       <th>Issue Type</th>
                       <th>Phone</th>
                       <th>Severity</th>
                       <th>Status</th>
                       <th>Date</th>
                       <th>Deadline</th>
                       <th>Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredComplaints.map(c => (
                      <tr key={c.id}>
                         <td className="id-cell">#{c.id}</td>
                         <td>{c.area}</td>
                         <td>{c.zone}</td>
                         <td>{c.issueType}</td>
                         <td>{c.phoneNumber}</td>
                         <td>
                            <span className={`badge badge-${getSeverityClass(c.severity)}`}>{c.severity}</span>
                         </td>
                         <td>
                            <span className={`status-badge ${getStatusClass(c.status)}`}>{c.status}</span>
                         </td>
                         <td>{new Date(c.createdDate || c.createdAt).toLocaleDateString()}</td>
                         <td>{c.deadline ? new Date(c.deadline).toLocaleDateString() : 'Pending'}</td>
                         <td>
                            <button className="btn-icon" onClick={() => handleView(c.id)}>
                               <Eye size={18} />
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
              <h3>No Incidents Found</h3>
              <p>You haven't reported any water quality issues yet.</p>
              <button className="btn-primary" onClick={() => navigate('/user/submit')}>File Report Now</button>
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
    const s = status.toUpperCase();
    if(s==='PENDING') return 'status-gold';
    if(s==='IN PROGRESS') return 'status-blue';
    if(s==='RESOLVED') return 'status-green';
    if(s==='OVERDUE') return 'status-red';
    return 'status-gray';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-card glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
           <div className="title-group">
              <span className="id-label">REPORT #{complaint.id}</span>
              <h2>Complaint Details</h2>
           </div>
           <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-scrollable">
           {loading || complaint.loading ? (
             <div className="loader-container p-4"><Loader2 size={32} className="spinner" /></div>
           ) : (
             <>
               <div className="readonly-grid">
                  <div className="grid-item">
                     <label>Issue Type</label>
                     <span>{complaint.issueType}</span>
                  </div>
                  <div className="grid-item">
                     <label>Area</label>
                     <span>{complaint.area}</span>
                  </div>
                  <div className="grid-item">
                     <label>Status</label>
                     <span className={`status-badge ${getStatusClass(complaint.status)} inline`}>{complaint.status}</span>
                  </div>
                  <div className="grid-item">
                     <label>Severity</label>
                     <span className={`badge badge-${complaint.severity?.toLowerCase() === 'high' ? 'high-sev' : complaint.severity?.toLowerCase() === 'medium' ? 'warning' : 'safe'} inline`}>{complaint.severity}</span>
                  </div>
                  <div className="grid-item">
                     <label>Created Date</label>
                     <span>{new Date(complaint.createdDate || complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="grid-item">
                     <label>Deadline</label>
                     <span>{complaint.deadline ? new Date(complaint.deadline).toLocaleDateString() : 'N/A'}</span>
                  </div>
               </div>

               <div className="desc-box glass-mini mt-4">
                  <label>Description</label>
                  <p>{complaint.description || 'No detailed description provided.'}</p>
               </div>
             </>
           )}
        </div>
        
        <div className="modal-footer">
           <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MyComplaintsPage;
