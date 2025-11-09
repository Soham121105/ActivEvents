import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 1. Create the Context
const AdminAuthContext = createContext();

// 2. Create the "hook" to use the context
export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

// 3. Create the "Provider" component
export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // This runs ONCE when the app loads
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedAdmin = localStorage.getItem('admin_data');
    
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
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
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    setToken(null);
    setAdmin(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // This is the "value" our pages will get
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
