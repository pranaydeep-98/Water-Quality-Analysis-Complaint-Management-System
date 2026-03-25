import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  AlertTriangle, 
  Phone,
  Compass,
  Calendar,
  CheckCircle,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import './SubmitComplaint.css';

const ZONES = [
  "North Zone",
  "South Zone",
  "East Zone",
  "West Zone",
  "Central Zone"
];

const ISSUE_TYPES = [
  "Water contamination",
  "Leakage",
  "Low pressure",
  "No water supply"
];

const SubmitComplaint = () => {
  const navigate = useNavigate();
  
  const [area, setArea] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [zone, setZone] = useState('');
  const [issueType, setIssueType] = useState('Water contamination');
  const [createdDate, setCreatedDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState({});
  const [serverError, setServerError] = useState('');
  const [successData, setSuccessData] = useState(null);
  
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  useEffect(() => {
    // Format: DD/MM/YYYY for UI display logic (but standard ISO backend push to avoid JPA parse errors)
    const today = new Date().toISOString().split('T')[0];
    setCreatedDate(today);
  }, []);

  const validate = () => {
    const errs = {};
    if (!area || area.length < 3) errs.area = "Area name must be at least 3 characters";
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) errs.phoneNumber = "Enter valid 10 digit number";
    if (!zone) errs.zone = "Please select a zone";
    if (!issueType) errs.issueType = "Please select an issue type";
    if (!createdDate) errs.createdDate = "Registration date is missing";
    
    setErrorObj(errs);
    return Object.keys(errs).length === 0;
  };

  const checkDuplicates = async (currentArea, currentIssueType) => {
    if (!currentArea || !currentIssueType) return;
    try {
        const response = await api.get('/complaints/user');
        const userComplaints = response.data || [];
        const duplicate = userComplaints.find(c =>
            c.area?.toLowerCase() === currentArea.toLowerCase() &&
            c.issueType?.toLowerCase() === currentIssueType.toLowerCase() &&
            c.status !== 'Resolved'
        );
        if (duplicate) {
            setDuplicateWarning(
                `⚠️ You already have an open complaint for ${currentIssueType} in ${currentArea} (ID: #${duplicate.id}). Please wait for it to be resolved.`
            );
            setIsSubmitDisabled(true);
        } else {
            setDuplicateWarning('');
            setIsSubmitDisabled(false);
        }
    } catch (e) {
        console.log('Duplicate check failed:', e);
    }
  };

  useEffect(() => {
    if (area && area.length >= 3 && issueType) {
        checkDuplicates(area, issueType);
    }
  }, [area, issueType]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      if (val.length <= 10) setPhoneNumber(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        area: area.trim(),
        phoneNumber,
        zone,
        issueType,
        createdDate,
        status: "Pending"
      };

      // Axios instance takes care of JWT, let's just make sure endpoints exist
      const res = await api.post('/complaints', payload);
      
      setSuccessData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      if (msg.includes('DUPLICATE_USER')) {
          setServerError(msg.replace('DUPLICATE_USER: ', ''));
      } else {
          setServerError('Failed to submit complaint. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setArea('');
    setPhoneNumber('');
    setZone('');
    setIssueType('Water contamination');
    setErrorObj({});
  };

  if (successData) {
    return (
      <div className="submit-page-wrapper">
         <div className="success-card glass-card anim-slide-up">
            <div className="success-icon-wrap">
               <CheckCircle size={48} />
            </div>
            <h2>Complaint Submitted Successfully</h2>
            <p className="success-msg">Your complaint has been logged and assigned to the respective zone.</p>
            
            <div className="success-details glass">
               <div className="sd-row">
                  <label>Complaint ID</label>
                  <span className="sd-val id">#{successData.id}</span>
               </div>
               <div className="sd-row">
                  <label>Area & Zone</label>
                  <span className="sd-val">{successData.area} • {successData.zone}</span>
               </div>
               <div className="sd-row">
                  <label>Detected Severity</label>
                  <span className={`badge sd-val badge-${successData.severity?.toLowerCase()}`}>{successData.severity}</span>
               </div>
               <div className="sd-row">
                  <label>Assigned Deadline</label>
                  <span className="sd-val">{successData.deadline || 'Pending calculation'}</span>
               </div>
            </div>

            <div className="success-actions">
              <button className="btn-primary w-100 mt-4" onClick={resetForm}>Submit Another Complaint</button>
              <button className="btn-outline w-100 mt-2" onClick={() => navigate('/user/complaints')}>View My Complaints</button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="submit-page-wrapper">
      <div className="submit-header">
         <h1>Submit a Water Issue</h1>
         <p>Please provide the exact details so our Field Officers can resolve it efficiently.</p>
      </div>

      <div className="submit-layout-full">
         <div className="main-form glass-card">
            {serverError && <div className="error-banner mb-4"><AlertTriangle size={18} />{serverError}</div>}
            
            <form onSubmit={handleSubmit}>
               
               <div className="form-grid">
                 {/* FIELD 1: AREA */}
                 <div className="form-group full-width">
                    <label><MapPin size={16} /> Area Name <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className={`form-input ${errorObj.area ? 'input-error' : ''}`} 
                      placeholder="Enter your area name e.g. Mangalpalli, Vastunagar" 
                      value={area} 
                      onChange={e => {
                        setArea(e.target.value);
                        if (errorObj.area) setErrorObj({...errorObj, area: null});
                      }} 
                    />
                    {errorObj.area && <span className="error-text">{errorObj.area}</span>}
                 </div>

                 {/* FIELD 2: PHONE NUMBER */}
                 <div className="form-group">
                    <label><Phone size={16} /> Mobile Number <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className={`form-input ${errorObj.phoneNumber ? 'input-error' : ''}`} 
                      placeholder="Enter your 10 digit phone number" 
                      value={phoneNumber} 
                      onChange={handlePhoneChange} 
                    />
                    {errorObj.phoneNumber && <span className="error-text">{errorObj.phoneNumber}</span>}
                 </div>

                 {/* FIELD 3: ZONE */}
                 <div className="form-group">
                    <label><Compass size={16} /> Administrative Zone <span className="text-danger">*</span></label>
                    <select 
                      className={`form-input ${errorObj.zone ? 'input-error' : ''}`} 
                      value={zone} 
                      onChange={e => {
                        setZone(e.target.value);
                        if (errorObj.zone) setErrorObj({...errorObj, zone: null});
                      }}
                    >
                      <option value="" disabled>Select Zone</option>
                      {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    {errorObj.zone && <span className="error-text">{errorObj.zone}</span>}
                 </div>

                 {/* FIELD 4: ISSUE TYPE */}
                 <div className="form-group full-width">
                    <label><AlertTriangle size={16} /> Issue Category <span className="text-danger">*</span></label>
                    <select 
                      className={`form-input ${errorObj.issueType ? 'input-error' : ''}`} 
                      value={issueType} 
                      onChange={e => {
                        setIssueType(e.target.value);
                        if (errorObj.issueType) setErrorObj({...errorObj, issueType: null});
                      }}
                    >
                      <option value="" disabled>Select Issue Type</option>
                      {ISSUE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    {errorObj.issueType && <span className="error-text">{errorObj.issueType}</span>}
                 </div>

                 {/* FIELD 5: DATE */}
                 <div className="form-group">
                    <label><Calendar size={16} /> Registration Date <span className="text-danger">*</span></label>
                    <input 
                      type="date" 
                      className="form-input read-only" 
                      value={createdDate} 
                      readOnly
                    />
                    {errorObj.createdDate && <span className="error-text">{errorObj.createdDate}</span>}
                 </div>
               </div>

               <div className="form-actions mt-4 align-right">
                  {duplicateWarning && (
                      <div className="duplicate-warning mb-3" style={{textAlign: 'left', color: '#B45309', background: '#FEF3C7', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #FDE68A'}}>
                          {duplicateWarning}
                      </div>
                  )}
                  <button type="submit" className="btn-primary submit-btn-large" disabled={loading || isSubmitDisabled}>
                     {loading ? <><Loader2 size={20} className="spinner" /> Processing...</> : 'Confirm Submission'}
                  </button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default SubmitComplaint;
