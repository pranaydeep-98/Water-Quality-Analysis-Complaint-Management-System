import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock,
  Save,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [slaHours, setSlaHours] = useState({ high: '', medium: '', low: '' });
  const [errors, setErrors] = useState({ high: '', medium: '', low: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings/sla');
      const config = response.data;
      
      setSlaHours({
        high: config.highSeverityHours || '4',
        medium: config.mediumSeverityHours || '24',
        low: config.lowSeverityHours || '72'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      showFeedback('error', error.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSlaChange = (e) => {
    const { name, value } = e.target;
    setSlaHours({ ...slaHours, [name]: value });
    
    let errorMsg = '';
    const num = parseInt(value);
    if (!value) {
      errorMsg = 'Value is required';
    } else if (name === 'high' && (num < 1 || num > 24)) {
      errorMsg = 'Value must be between 1 and 24 hours';
    } else if (name === 'medium' && (num < 6 || num > 72)) {
      errorMsg = 'Value must be between 6 and 72 hours';
    } else if (name === 'low' && (num < 12 || num > 168)) {
      errorMsg = 'Value must be between 12 and 168 hours';
    }
    setErrors({ ...errors, [name]: errorMsg });
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const hasErrors = !slaHours.high || !slaHours.medium || !slaHours.low ||
                      errors.high || errors.medium || errors.low;
                      
    if (hasErrors) {
      showFeedback('error', 'Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        highSeveritySla: Number(slaHours.high),
        mediumSeveritySla: Number(slaHours.medium),
        lowSeveritySla: Number(slaHours.low)
      };
      
      console.log('SLA Payload:', payload);
      
      const response = await axios.post('/api/settings/sla', payload);
      showFeedback('success', response.data.message || 'SLA settings updated successfully');
    } catch (error) {
      console.error('Error saving settings - Backend Validation Error:', error.response?.data || error);
      showFeedback('error', error.response?.data?.error || 'Invalid input or save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-content settings-page">
        <div className="loading-state">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="admin-page-content settings-page">
      <div className="settings-header">
        <h1>Admin Settings</h1>
        <p className="subtitle">Configure system-wide resolution thresholds and SLA rules.</p>
      </div>

      {message.text && (
        <div className={`settings-alert ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-grid single-col">
        <div className="settings-card sla-config glass-card">
          <div className="card-header">
            <div className="title-row">
              <Clock size={20} className="text-primary" />
              <h2>SLA Threshold Configuration</h2>
            </div>
            <div className="header-info">
              <Info size={14} />
              <span>SLA settings define the maximum allowed time for complaint resolution.</span>
            </div>
          </div>

          <form className="config-form" onSubmit={handleSave}>
            <div className="form-group">
              <div className="label-row">
                <label>High Severity SLA (Hours)</label>
                <span className="badge high">Critical</span>
              </div>
              <p className="field-desc">
                Maximum allowed resolution time for critical issues like "Contamination" or "No Water Supply".
                If exceeded, the complaint is automatically flagged as <strong>BREACHED</strong>.
              </p>
              <div className="input-row">
                <AlertTriangle size={16} className="text-danger" />
                <input 
                  type="number" 
                  name="high" 
                  value={slaHours.high} 
                  onChange={handleSlaChange}
                  placeholder="Enter hours (e.g., 4)"
                  min="1"
                  max="24"
                  required 
                />
                <span className="input-unit">hours</span>
              </div>
              {errors.high && <span className="inline-error">{errors.high}</span>}
              {!errors.high && slaHours.high && (
                 <p className="impact-text">
                   If set to {slaHours.high} &rarr; complaints will breach after {slaHours.high} hours.
                 </p>
              )}
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Medium Severity SLA (Hours)</label>
                <span className="badge medium">Moderate</span>
              </div>
              <p className="field-desc">
                Threshold for issues like "Leakage" or "Low Pressure". 
                Requires steady resolution to prevent escalation.
              </p>
              <div className="input-row">
                <Clock size={16} className="text-warning" />
                <input 
                  type="number" 
                  name="medium" 
                  value={slaHours.medium} 
                  onChange={handleSlaChange}
                  placeholder="Enter hours (e.g., 24)"
                  min="6"
                  max="72"
                  required 
                />
                <span className="input-unit">hours</span>
              </div>
              {errors.medium && <span className="inline-error">{errors.medium}</span>}
              {!errors.medium && slaHours.medium && (
                 <p className="impact-text">
                   If set to {slaHours.medium} &rarr; complaints will breach after {slaHours.medium} hours.
                 </p>
              )}
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Low Severity SLA (Hours)</label>
                <span className="badge low">Routine</span>
              </div>
              <p className="field-desc">
                Standard resolution timeframe for general inquiries or non-critical maintenance reports.
              </p>
              <div className="input-row">
                <CheckCircle size={16} className="text-success" />
                <input 
                  type="number" 
                  name="low" 
                  value={slaHours.low} 
                  onChange={handleSlaChange}
                  placeholder="Enter hours (e.g., 72)"
                  min="12"
                  max="168"
                  required 
                />
                <span className="input-unit">hours</span>
              </div>
              {errors.low && <span className="inline-error">{errors.low}</span>}
              {!errors.low && slaHours.low && (
                 <p className="impact-text">
                   If set to {slaHours.low} &rarr; complaints will breach after {slaHours.low} hours.
                 </p>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn-save secondary" 
                onClick={() => {
                  setSlaHours({ high: '4', medium: '24', low: '72' });
                  setErrors({ high: '', medium: '', low: '' });
                }}
              >
                Reset to Recommended Defaults
              </button>
              <button 
                type="submit" 
                className="btn-save primary" 
                disabled={saving || errors.high || errors.medium || errors.low || !slaHours.high || !slaHours.low || !slaHours.medium}
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={18} /> Save Thresholds
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

