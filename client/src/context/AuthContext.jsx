import React, { createContext, useState, useContext, useEffect } from 'react';
import { stallAxios } from '../utils/apiAdapters';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [stall, setStall] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- THIS INTERCEPTOR MUST BE ATTACHED UNCONDITIONALLY ---
    const interceptor = stallAxios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
           logout();
        }
        return Promise.reject(error);
      }
    );
    // --- END OF FIX ---

    const storedToken = localStorage.getItem('stall_token');
    const storedStall = localStorage.getItem('stall_data');
    
    if (storedToken) {
      stallAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      
      if (storedStall) {
        setStall(JSON.parse(storedStall));
      }
      setLoading(false);
    } else {
      setLoading(false);
    }

    // Clean up interceptor on unmount
    return () => stallAxios.interceptors.response.eject(interceptor);
  }, []);

  const login = (stallData, token) => {
    localStorage.setItem('stall_token', token);
    localStorage.setItem('stall_data', JSON.stringify(stallData));
    setToken(token);
    setStall(stallData);
    stallAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('stall_token');
    localStorage.removeItem('stall_data');
    setToken(null);
    setStall(null);
    delete stallAxios.defaults.headers.common['Authorization'];
  };

  const value = {
    stall,
    token,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};