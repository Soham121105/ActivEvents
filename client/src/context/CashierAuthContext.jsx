import React, { createContext, useState, useContext, useEffect } from 'react';
// --- CHANGE: Import cashierAxios ---
import { cashierAxios } from '../utils/apiAdapters';

const CashierAuthContext = createContext();

export const useCashierAuth = () => {
  return useContext(CashierAuthContext);
};

export const CashierAuthProvider = ({ children }) => {
  const [cashier, setCashier] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('cashier_token');
    // --- NEW: Also load cashier data if we saved it (we will need this for url_slug later) ---
    const storedCashier = localStorage.getItem('cashier_data');

    if (storedToken) {
      // --- CHANGE: Use cashierAxios ---
      cashierAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      if (storedCashier) {
         setCashier(JSON.parse(storedCashier));
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (cashierData, token) => {
    localStorage.setItem('cashier_token', token);
    // --- NEW: Save cashier data too ---
    localStorage.setItem('cashier_data', JSON.stringify(cashierData));
    setToken(token);
    setCashier(cashierData);
    // --- CHANGE: Use cashierAxios ---
    cashierAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('cashier_token');
    localStorage.removeItem('cashier_data');
    setToken(null);
    setCashier(null);
    // --- CHANGE: Use cashierAxios ---
    delete cashierAxios.defaults.headers.common['Authorization'];
  };

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
