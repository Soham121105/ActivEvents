import React, { createContext, useState, useContext, useEffect } from 'react';
import { visitorAxios } from '../utils/apiAdapters';
import { jwtDecode } from "jwt-decode";

const VisitorAuthContext = createContext();
export const useVisitorAuth = () => useContext(VisitorAuthContext);

export const VisitorAuthProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Start true on mount

  useEffect(() => {
    const storedToken = localStorage.getItem('visitor_token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setVisitor(decoded.visitor); // Set visitor from token
        setToken(storedToken);
        visitorAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Go fetch the *latest* balance and merge info
        visitorAxios.get('/visitor/me')
          .then(res => {
             // res.data contains the wallet info + branding info
             const { event_name, club_name, club_logo_url, ...walletData } = res.data;
             
             // Set the wallet state
             setWallet(walletData);
             
             // Merge fresh data from /me with token data
             setVisitor(prev => ({ 
                ...prev, // Keep all token data (slug, event_id, etc.)
                ...decoded.visitor, // Re-apply just in case
                event_name,
                club_name,
                club_logo_url
             }));
          })
          .catch(() => {
            // If /me fails, token is bad, log out
            logout(); 
          })
          .finally(() => {
            // **FIX 1:** Always set loading to false after API call
            setLoading(false); 
          });
      } catch (e) {
        logout(); // This will set loading to false
      }
    } else {
      // No token, so we are done loading
      setLoading(false);
    }
  }, []); // Empty array means this runs only once on page load/refresh

  const login = (walletData, newToken) => {
    localStorage.setItem('visitor_token', newToken);
    const decoded = jwtDecode(newToken);
    setVisitor(decoded.visitor); // This is the full payload from the login API
    setToken(newToken);
    setWallet(walletData); // This is the wallet object from login API
    visitorAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    // **FIX 2:** Set loading to false after login is complete
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('visitor_token');
    localStorage.removeItem('activ_visitor_identifier');
    localStorage.removeItem('activ_visitor_loginType');
    setToken(null);
    setWallet(null);
    setVisitor(null);
    delete visitorAxios.defaults.headers.common['Authorization'];

    // **FIX 3:** Set loading to false after logout is complete
    setLoading(false);
  };
  
  const updateBalance = (newBalance) => {
    setWallet(prev => ({ ...prev, current_balance: newBalance }));
  };

  return (
    <VisitorAuthContext.Provider value={{ wallet, visitor, token, login, logout, updateBalance, loading }}>
      {/* This provider will re-render its children when state changes.
        We don't need to check 'loading' here, the child components
        (like VisitorLayout) are responsible for checking 'loading'.
      */}
      {children}
    </VisitorAuthContext.Provider>
  );
};
