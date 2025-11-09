import React, { createContext, useState, useContext, useEffect } from 'react';
// --- CHANGE: Import the specific adapter, NOT generic axios ---
import { adminAxios } from '../utils/apiAdapters';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_data');
    
    if (storedToken) {
      // --- CHANGE: Set header ONLY on adminAxios ---
      adminAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      if (storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (adminData, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_data', JSON.stringify(adminData));
    setToken(token);
    setAdmin(adminData);
    // --- CHANGE: Set header ONLY on adminAxios ---
    adminAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    setToken(null);
    setAdmin(null);
    // --- CHANGE: Remove header ONLY from adminAxios ---
    delete adminAxios.defaults.headers.common['Authorization'];
  };

  const value = {
    admin,
    token,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
};
