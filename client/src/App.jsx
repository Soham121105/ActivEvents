import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useAdminAuth } from './context/AdminAuthContext'; // --- NEW ---
import axios from 'axios'; // --- NEW ---

// --- This is our "Private Route" hook ---
const useAdminPrivateRoute = () => {
  const { token, logout } = useAdminAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate('/admin-login');
      return; // Stop execution if no token
    }

    // Set the token for all subsequent admin API calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Add interceptor to catch 401/403 errors and log out
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Only check for admin auth errors (401/403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Check if the error is from a route that *should* be admin-protected
          const isProtectedAdminRoute = error.config.url.includes('/api/events');
          
          if (isProtectedAdminRoute) {
            console.log("Admin auth error detected, logging out.");
            logout();
            navigate('/admin-login');
          }
        }
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => axios.interceptors.response.eject(interceptor);

  }, [token, navigate, logout]);
};


const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #f9fafb; /* gray-50 */
    color: #1f2937; /* gray-800 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* Simple scrollbar for a cleaner look */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    background: #d1d5db; /* gray-300 */
    border-radius: 6px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; /* gray-400 */
  }
`;

const AppLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.nav`
  width: 240px;
  background-color: white;
  border-right: 1px solid #e5e7eb; /* gray-200 */
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

// --- NEW: Club Branding Section ---
const ClubInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
`;

const ClubLogo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
`;

const ClubName = styled.div`
  font-size: 1.25rem; /* 20px */
  font-weight: 700;
  color: #111827; /* gray-900 */
  line-height: 1.2;
`;
// --- End New ---

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 8px;

  /* This styles the <NavLink> component from react-router-dom */
  a {
    display: flex; /* Changed to flex for icons */
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    color: #374151; /* gray-700 */
    transition: all 0.2s;

    &:hover {
      background-color: #f3f4f6; /* gray-100 */
    }

    /* This is the "active" state, for the page we are currently on */
    &.active {
      background-color: #eef2ff; /* indigo-50 */
      color: #4338ca; /* indigo-700 */
    }
  }
`;

// --- NEW: Footer ---
const SidebarFooter = styled.div`
  margin-top: auto; /* Pushes to bottom */
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  background-color: #f3f4f6;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  font-family: inherit;

  &:hover {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;

const PoweredBy = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 16px;
`;
// --- End New ---

const MainContent = styled.main`
  flex-grow: 1; /* This makes it take up all remaining space */
  padding: 32px 48px;
  overflow-y: auto; /* Adds scrolling just to this content area */
`;


function App() {
  useAdminPrivateRoute(); // --- NEW: Protect this layout
  const { admin, logout } = useAdminAuth(); // --- NEW: Get auth functions
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <AppLayout>
      <GlobalStyle />
      
      <Sidebar>
        {/* --- NEW: Club Branding --- */}
        <ClubInfo>
          {admin?.logo_url && <ClubLogo src={admin.logo_url} alt="Club Logo" />}
          <ClubName>{admin?.name || 'ActivEvents'}</ClubName>
        </ClubInfo>
        
        <NavList>
          <NavItem>
            <NavLink to="/">
              Dashboard
            </NavLink>
          </NavItem>
        </NavList>

        {/* --- NEW: Footer with Logout and Branding --- */}
        <SidebarFooter>
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
          <PoweredBy>
            Powered by ActivEvents
          </PoweredBy>
        </SidebarFooter>
      </Sidebar>
      
      <MainContent>
        <Outlet />
      </MainContent>

    </AppLayout>
  );
}

export default App;
