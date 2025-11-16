import React, { createContext, useState, useContext, useEffect } from 'react';
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
    // --- THIS INTERCEPTOR MUST BE ATTACHED UNCONDITIONALLY ---
    const interceptor = cashierAxios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
           logout();
        }
        return Promise.reject(error);
      }
    );
    // --- END OF FIX ---

    const storedToken = localStorage.getItem('cashier_token');
    const storedCashier = localStorage.getItem('cashier_data');

    if (storedToken) {
      cashierAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      if (storedCashier) {
         setCashier(JSON.parse(storedCashier));
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
    
    // Clean up interceptor on unmount
    return () => cashierAxios.interceptors.response.eject(interceptor);
  }, []);

  const login = (cashierData, token) => {
    localStorage.setItem('cashier_token', token);
    localStorage.setItem('cashier_data', JSON.stringify(cashierData));
    setToken(token);
    setCashier(cashierData);
    cashierAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('cashier_token');
    localStorage.removeItem('cashier_data');
    setToken(null);
    setCashier(null);
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