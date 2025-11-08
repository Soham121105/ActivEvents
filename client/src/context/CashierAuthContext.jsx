import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 1. Create the Context
const CashierAuthContext = createContext();

// 2. Create the "hook" to use the context
export const useCashierAuth = () => {
  return useContext(CashierAuthContext);
};

// 3. Create the "Provider" component
export const CashierAuthProvider = ({ children }) => {
  const [cashier, setCashier] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // This runs ONCE when the app loads
  useEffect(() => {
    const storedToken = localStorage.getItem('cashier_token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      // We can add a "GET /api/cashier/me" route later to get cashier data
      // For now, this is fine.
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (cashierData, token) => {
    localStorage.setItem('cashier_token', token);
    setToken(token);
    setCashier(cashierData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('cashier_token');
    setToken(null);
    setCashier(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // This is the "value" our pages will get
  const value = {
    cashier,
    token,
    login,
    logout
  };

  return (
    <CashierAuthContext.Provider value={value}>
      {!loading && children}
    </CashierAuthContext.Provider>
  );
};
