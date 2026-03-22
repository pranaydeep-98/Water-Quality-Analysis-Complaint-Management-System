import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        const savedRole = localStorage.getItem('role') || decoded.role;
        setToken(savedToken);
        setRole(savedRole);
        setUser({
          id: decoded.userId || decoded.id,
          name: decoded.name || localStorage.getItem('name') || 'User',
          email: decoded.email || decoded.sub || '',
          role: savedRole,
        });
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newRole, name, email) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('name', name);
    
    setToken(newToken);
    setRole(newRole);
    setUser({ name, email, role: newRole });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
