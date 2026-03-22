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
  X
} from 'lucide-react';
import api from '../services/api';
import './MyComplaintsPage.css';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const fetchUserComplaints = async () => {
      setLoading(true);
      try {
        const response = await api.get('/complaints');
        setComplaints(response.data.content || [
          { id: 4398, issueType: 'Discoloration', area: 'Central Park', severity: 'Medium', status: 'Under Review', createdAt: '2026-03-20T10:24:00', description: 'Yellow water from main supply.' },
          { id: 4312, issueType: 'Pressure', area: 'Lakeside', severity: 'Low', status: 'In Progress', createdAt: '2026-03-19T08:15:00', description: 'Low pressure for 2 days.' },
          { id: 4255, issueType: 'Leakage', area: 'Central Park', severity: 'High', status: 'Resolved', createdAt: '2026-03-15T14:20:00', description: 'Main pipe burst.' }
        ]);
      } catch (err) {
        console.error("Failed to fetch complaints", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserComplaints();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return c.status !== 'Resolved';
    if (filter === 'Resolved') return c.status === 'Resolved';
    return true;
  });

  return (
    <div className="my-complaints-container">
      <div className="header-row">
        <div className="title-group">
          <h1>My Reported Incidents</h1>
          <p>Track the progress and history of all complaints filed by you.</p>
        </div>
        <div className="header-actions">
           <div className="filter-pills glass">
              <button className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>All</button>
              <button className={filter === 'Pending' ? 'active' : ''} onClick={() => setFilter('Pending')}>Pending</button>
              <button className={filter === 'Resolved' ? 'active' : ''} onClick={() => setFilter('Resolved')}>Resolved</button>
           </div>
        </div>
      </div>

      <div className="complaints-collection">
         {loading ? (
           <div className="col-loader">Analyzing your records...</div>
         ) : filteredComplaints.length > 0 ? (
           <div className="complaints-grid">
              {filteredComplaints.map(c => (
                <div key={c.id} className="complaint-card-citizen glass-card">
                   <div className="card-top">
                      <div className="type-group">
                         <h3>{c.issueType}</h3>
                         <span className="id-tag">#{c.id}</span>
                      </div>
                      <span className={`status-tag ${c.status?.toLowerCase().replace(' ', '-')}`}>{c.status}</span>
                   </div>
                   
                   <div className="card-info">
                      <div className="info-item">
                         <MapPin size={14} />
                         <span>{c.area}</span>
                      </div>
                      <div className="info-item">
                         <Clock size={14} />
                         <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="info-item">
                         <AlertCircle size={14} />
                         <span className={`text-badge ${c.severity?.toLowerCase()}`}>{c.severity} Priority</span>
                      </div>
                   </div>

                   <div className="card-footer">
                      <button className="view-details-btn" onClick={() => setSelectedComplaint(c)}>
                        View Activity Log <ChevronRight size={16} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
         ) : (
           <div className="empty-state glass-card">
              <div className="icon-empty"><Activity size={48} /></div>
              <h3>No Incidents Found</h3>
              <p>You haven't reported any water quality issues yet. Your dashboard will populate once you file your first report.</p>
              <button className="btn-primary" onClick={() => window.location.href='/user/submit'}>File Report Now</button>
           </div>
         )}
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
    <div className="detail-modal-card glass" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
         <div className="title-group">
            <span className="id-label">REPORT #{complaint.id}</span>
            <h2>{complaint.issueType} Log</h2>
         </div>
         <button className="close-btn" onClick={onClose}><X size={24} /></button>
      </div>
      
      <div className="modal-scrollable">
         <div className="complaint-summary glass">
            <div className="sum-item">
               <label>Area</label>
               <span>{complaint.area}</span>
            </div>
            <div className="sum-item">
               <label>Status</label>
               <span className={`status-tag ${complaint.status?.toLowerCase().replace(' ', '-')}`}>{complaint.status}</span>
            </div>
            <div className="sum-item">
               <label>Filed On</label>
               <span>{new Date(complaint.createdAt).toLocaleString()}</span>
            </div>
         </div>

         <div className="activity-timeline">
            <h3>Progress Timeline</h3>
            <div className="timeline-trail">
               <TimelineStep 
                 title="Report Received" 
                 time={new Date(complaint.createdAt).toLocaleString()} 
                 desc="Your complaint has been successfully queued in our Intelligent Management System."
                 done
               />
               <TimelineStep 
                 title="Assigned to Field Unit" 
                 time="Today, 11:30 AM" 
                 desc="District field officer assigned for site inspection and water sampling."
                 done={complaint.status !== 'Open'}
               />
               <TimelineStep 
                 title="Remediation in Progress" 
                 time="Pending" 
                 desc="Physical repairs or chemical balancing being performed on the supply lines."
                 done={complaint.status === 'Resolved'}
               />
               <TimelineStep 
                 title="Issue Resolved" 
                 time="Pending" 
                 desc="System restoration confirmed and verified via secondary inspection."
                 done={complaint.status === 'Resolved'}
               />
            </div>
         </div>
      </div>
      
      <div className="modal-footer">
         <button className="btn-close" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const TimelineStep = ({ title, time, desc, done }) => (
  <div className={`timeline-step ${done ? 'done' : ''}`}>
     <div className="step-marker">
        <div className="marker-dot">{done ? <CheckCircle size={14} /> : null}</div>
        <div className="marker-line"></div>
     </div>
     <div className="step-content">
        <div className="step-title-row">
           <span className="step-name">{title}</span>
           <span className="step-time">{time}</span>
        </div>
        <p className="step-desc">{desc}</p>
     </div>
  </div>
);

export default MyComplaintsPage;
