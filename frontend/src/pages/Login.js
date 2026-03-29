import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Login = () => {
  const { login: authLogin } = useAuth() || {};
  const [activeTab, setActiveTab] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/auth/login', {
        email: email,
        password: password
      });

      const token = response.data.token || response.data.accessToken || response.data.jwt || response.data.access_token;
      const role = response.data.role || response.data.userRole || response.data.authorities?.[0]?.authority || response.data.authorities?.[0];
      const name = response.data.name || response.data.username || email;

      if (!token) {
        setError('Login failed - no token received from server');
        return;
      }

      const upperRole = role?.toString().toUpperCase();
      
      // 1-3. Save to localStorage first
      localStorage.setItem('token', token);
      localStorage.setItem('role', upperRole);
      localStorage.setItem('name', name);
      localStorage.setItem('email', email);

      // 4. Update AuthContext
      if (authLogin) {
        authLogin(token, upperRole, name, email);
      }

      // 5. Navigate
      if (upperRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (upperRole === 'USER') {
        navigate('/user/dashboard');
      } else {
        setError('Unknown role received: ' + role);
      }

    } catch (err) {
      console.error('Login error:', err);
      let errorMsg = 'Login failed. Check your credentials.';
      if (err.response && err.response.data) {
        const data = err.response.data;
        errorMsg = data.message || data.error || data.errorMessage || data.detail || (typeof data === 'string' ? data : errorMsg);
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'ADMIN') {
      setEmail('admin@aquawatch.com');
    } else {
      setEmail('');
    }
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card anim-fade-in">
        <div className="auth-header">
           <div className="brand-badge">A</div>
           <h1>AquaWatch Login</h1>
           <p>Access your dashboard with your credentials.</p>
        </div>

        <div className="role-tabs">
          <button 
            className={activeTab === 'USER' ? 'active' : ''} 
            onClick={() => switchTab('USER')}
          >
            Citizen
          </button>
          <button 
            className={activeTab === 'ADMIN' ? 'active' : ''} 
            onClick={() => switchTab('ADMIN')}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} /> 
            <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-field">
            <label><Mail size={14} /> Email Address</label>
            <input 
              type="email" 
              placeholder={activeTab === 'ADMIN' ? 'admin@aquawatch.com' : 'your@email.com'}
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              required
            />
          </div>

          <div className="input-field">
            <label><Lock size={14} /> Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                required
              />
              <button 
                type="button" 
                className="toggle-eye" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <><Loader3 className="spinner" size={20} /> Authenticating...</> : `Login as ${activeTab === 'ADMIN' ? 'Admin' : 'Citizen'}`}
          </button>
        </form>

        <div className="auth-footer">
          {activeTab === 'USER' ? (
            <p>
              Don't have an account? 
              <span onClick={() => navigate('/register')}>Register here <ChevronRight size={14} style={{verticalAlign: 'middle'}} /></span>
            </p>
          ) : (
            <div className="admin-notice">
               <ShieldCheck size={16} />
               <span>Admin accounts are pre-configured. Contact administrator for access.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple spinner component if Loader2 is not enough
const Loader3 = ({ size, className }) => (
  <Loader2 size={size} className={className} />
);

export default Login;
