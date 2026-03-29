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
      const response = await axios.get('/api/admin/sla-config');
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
        highSeverityHours: Number(slaHours.high),
        mediumSeverityHours: Number(slaHours.medium),
        lowSeverityHours: Number(slaHours.low)
      };
      
      console.log('SLA Payload:', payload);
      
      await axios.post('/api/admin/sla-config', payload);
      showFeedback('success', 'SLA thresholds updated successfully. All future complaints will now use these resolution targets.');
    } catch (error) {
      console.error('Error saving settings - Backend Validation Error:', error.response?.data || error);
      showFeedback('error', error.response?.data?.message || 'Invalid input or save failed');
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
        {/* Only other settings cards should go here if any */}
      </div>
    </div>
  );
};

export default Settings;

