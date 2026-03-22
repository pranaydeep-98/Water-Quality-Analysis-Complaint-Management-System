import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import './Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(''); // Weak, Medium, Strong
  
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (!val) setStrength('');
    else if (val.length < 6) setStrength('Weak');
    else if (val.length < 10) setStrength('Medium');
    else setStrength('Strong');
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    
    // Frontend validations first
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post('/api/auth/register', {
        name: name,
        email: email,
        password: password,
        role: 'USER'
      });

      console.log('Register success:', response.data);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error('Register error:', err);
      let errorMsg = 'Registration failed. Please try again.';
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

  return (
    <div className="auth-page">
      <div className="auth-card glass-card anim-fade-in">
        <div className="auth-header">
           <div className="brand-badge">A</div>
           <h1>Register to AquaWatch</h1>
           <p>Join the secure water quality community.</p>
        </div>

        {success && <div className="success-banner"><CheckCircle2 size={18} /> {success}</div>}
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} /> 
            <span>{typeof error === 'object' ? JSON.stringify(error) : error}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-field">
            <label><User size={14} /> Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <label><Mail size={14} /> Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={handlePasswordChange}
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
            {password && (
              <div className="strength-row">
                 <div className={`strength-bar ${strength.toLowerCase()}`}></div>
                 <span>Strength: {strength}</span>
              </div>
            )}
          </div>

          <div className="input-field">
            <label><Lock size={14} /> Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (password && e.target.value && password !== e.target.value) {
                  setError('Passwords do not match');
                } else {
                  setError('');
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <><Loader3 className="spinner" size={20} /> Registering...</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <span onClick={() => navigate('/login')}>Login here</span>
        </p>
      </div>
    </div>
  );
};

const Loader3 = ({ size, className }) => (
  <Loader2 size={size} className={className} />
);

export default Register;
