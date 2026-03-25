import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [userName, setUserName] = useState('');
    const [area, setArea] = useState('');
    const [waterIssue, setWaterIssue] = useState('');
    const [zone, setZone] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [severity, setSeverity] = useState('LOW');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('username');
        if (storedUser) setUserName(storedUser);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.post('/complaints', { 
                userName, 
                area, 
                waterIssue, 
                zone, 
                phoneNumber, 
                severity 
            });
            setMessage('Complaint submitted successfully!');
            setArea('');
            setWaterIssue('');
            setZone('');
            setPhoneNumber('');
            setSeverity('LOW');
        } catch (err) {
            setMessage('Error submitting complaint.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Submit Water Quality Complaint</h1>
            <div className="card">
                {message && <div className={message.includes('Error') ? 'error-msg' : 'success-msg'}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={userName} 
                            disabled 
                            className="bg-gray"
                        />
                    </div>
                    <div className="form-group">
                        <label>Area / Location</label>
                        <input 
                            type="text" 
                            value={area} 
                            onChange={(e) => setArea(e.target.value)} 
                            placeholder="e.g. MG Road, North Campus"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Zone</label>
                        <input 
                            type="text" 
                            value={zone} 
                            onChange={(e) => setZone(e.target.value)} 
                            placeholder="e.g. West Zone, Block B"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                            type="text" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)} 
                            placeholder="Enter 10-digit number"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Severity Level</label>
                        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Water Quality Issue</label>
                        <textarea 
                            value={waterIssue} 
                            onChange={(e) => setWaterIssue(e.target.value)} 
                            rows="4"
                            placeholder="Describe the issue (e.g. Muddy water, low pressure, foul smell)..."
                            required 
                        ></textarea>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;
