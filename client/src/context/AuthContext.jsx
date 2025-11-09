import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 1. Create the Context (the "global state")
const AuthContext = createContext();

// 2. Create a "hook" to make it easy to use this context
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the "Provider" component
// This component will wrap our entire Stall application
export const AuthProvider = ({ children }) => {
  const [stall, setStall] = useState(null); // The logged-in stall's data
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Is the app initializing?

  useEffect(() => {
    // This runs ONCE when the app loads
    const storedToken = localStorage.getItem('stall_token');
    const storedStall = localStorage.getItem('stall_data'); // --- NEW ---
    
    if (storedToken) {
      // If we have a token, set it on axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      
      // --- NEW: Load stall data from local storage ---
      if (storedStall) {
        setStall(JSON.parse(storedStall));
      }
      
      setLoading(false);
      
    } else {
      // No token, so we are done loading
      setLoading(false);
    }
  }, []);

  const login = (stallData, token) => {
    // 1. Save data to storage and state
    localStorage.setItem('stall_token', token);
    localStorage.setItem('stall_data', JSON.stringify(stallData)); // --- NEW ---
    setToken(token);
    setStall(stallData);
    
    // 2. Set the default header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    // 1. Clear data from storage and state
    localStorage.removeItem('stall_token');
    localStorage.removeItem('stall_data'); // --- NEW ---
    setToken(null);
    setStall(null);
    
    // 2. Clear the default header
    delete axios.defaults.headers.common['Authorization'];
  };

  // This is the "value" our pages will get
  const value = {
    stall, // --- UPDATED: Expose stall object ---
    token,
    login,
    logout
  };

  // We return the provider, passing it the value.
  // We don't render children until we've checked for the token.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
