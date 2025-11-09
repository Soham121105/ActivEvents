import React, { createContext, useState, useContext, useEffect } from 'react';
import { visitorAxios } from '../utils/apiAdapters';
import { jwtDecode } from "jwt-decode";

const VisitorAuthContext = createContext();
export const useVisitorAuth = () => useContext(VisitorAuthContext);

export const VisitorAuthProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('visitor_token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setVisitor(decoded.visitor);
        setToken(storedToken);
        visitorAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        visitorAxios.get('/visitor/me')
          .then(res => {
             const { event_name, club_name, club_logo_url, ...walletData } = res.data;
             setWallet(walletData);
             setVisitor(prev => ({ ...prev, event_name, club_name, club_logo_url }));
          })
          .catch(() => logout())
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (walletData, newToken) => {
    localStorage.setItem('visitor_token', newToken);
    const decoded = jwtDecode(newToken);
    setVisitor(decoded.visitor);
    setToken(newToken);
    setWallet(walletData);
    visitorAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('visitor_token');
    setToken(null);
    setWallet(null);
    setVisitor(null);
    delete visitorAxios.defaults.headers.common['Authorization'];
  };
  
  const updateBalance = (newBalance) => {
    setWallet(prev => ({ ...prev, current_balance: newBalance }));
  };

  return (
    <VisitorAuthContext.Provider value={{ wallet, visitor, token, login, logout, updateBalance, loading }}>
      {!loading && children}
    </VisitorAuthContext.Provider>
  );
};
