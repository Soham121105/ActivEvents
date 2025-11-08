import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 1. Create the Context
const VisitorAuthContext = createContext();

// 2. Create the "hook" to use the context
export const useVisitorAuth = () => {
  return useContext(VisitorAuthContext);
};

// 3. Create the "Provider" component
export const VisitorAuthProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // This runs ONCE when the app loads
  useEffect(() => {
    const storedToken = localStorage.getItem('visitor_token');
    if (storedToken) {
      // Set the token for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      
      // Try to fetch the wallet to verify the token
      axios.get('http://localhost:3001/api/visitor/me')
        .then(res => {
          setWallet(res.data);
        })
        .catch(err => {
          // Token is invalid or expired
          localStorage.removeItem('visitor_token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (walletData, token) => {
    localStorage.setItem('visitor_token', token);
    setToken(token);
    setWallet(walletData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('visitor_token');
    setToken(null);
    setWallet(null);
    delete axios.defaults.headers.common['Authorization'];
  };
  
  // This allows the payment page to update the balance
  const updateBalance = (newBalance) => {
    setWallet(prevWallet => ({ ...prevWallet, current_balance: newBalance }));
  };

  // This is the "value" our pages will get
  const value = {
    wallet,
    token,
    login,
    logout,
    updateBalance // <-- expose the balance updater
  };

  return (
    <VisitorAuthContext.Provider value={value}>
      {!loading && children}
    </VisitorAuthContext.Provider>
  );
};
