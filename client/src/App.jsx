import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useAdminAuth } from './context/AdminAuthContext';
import { adminAxios } from './utils/apiAdapters'; // Use the correct adapter

// --- Private Route Hook ---
const useAdminPrivateRoute = () => {
  const { token, logout } = useAdminAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate('/admin-login');
      return;
    }
    // Set token for adminAxios
    adminAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Interceptor for 401/403 errors specific to admin routes
    const interceptor = adminAxios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
           // If we get an auth error, log out and redirect
           logout();
           navigate('/admin-login');
        }
        return Promise.reject(error);
      }
    );
    // Clean up interceptor on component unmount
    return () => adminAxios.interceptors.response.eject(interceptor);
  }, [token, navigate, logout]);
};

// --- MODERN STYLING ---
const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #6366f1; /* Indigo 500 */
    --primary-dark: #4f46e5; /* Indigo 600 */
    --bg-main: #f3f4f6; /* Gray 100 */
    --bg-sidebar: #ffffff;
    --text-primary: #111827; /* Gray 900 */
    --text-secondary: #6b7280; /* Gray 500 */
    --border-color: #e5e7eb; /* Gray 200 */
  }
  body {
    margin: 0;
    background-color: var(--bg-main);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
`;

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

// --- TOP NAVBAR ---
const TopBar = styled.header`
  height: 64px;
  background-color: white;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Logo = styled.img`
  height: 32px;
  width: auto;
  border-radius: 6px;
`;

const BrandName = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserEmailDisplay = styled.span`
  font-weight: 500;
  color: var(--text-secondary);
  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoutButton = styled.button`
  background-color: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: #fecaca; }
`;

// --- SIDEBAR ---
const Sidebar = styled.aside`
  width: 260px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  margin-top: 64px; /* Offset for TopBar */
  height: calc(100vh - 64px);
  overflow-y: auto;
  transition: transform 0.3s ease-in-out;
  position: fixed;
  z-index: 9;

  @media (max-width: 768px) {
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-primary);
  margin-right: 16px;
  @media (max-width: 768px) { display: block; }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: var(--bg-main);
    color: var(--text-primary);
  }
  &.active {
    background-color: #eef2ff;
    color: var(--primary);
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-top: 64px;
  padding: 32px;
  overflow-y: auto;
  margin-left: 260px; /* Make space for fixed sidebar */

  @media (max-width: 768px) {
    padding: 16px;
    margin-left: 0;
  }
`;

const MobileOverlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 8;
  }
`;

function App() {
  useAdminPrivateRoute();
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <LayoutContainer>
      <GlobalStyle />
      
      <TopBar>
        <BrandSection>
          <MobileMenuToggle onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰
          </MobileMenuToggle>
          {admin?.logo_url ? (
            <Logo src={admin.logo_url} alt="Club Logo" />
          ) : (
            <div style={{width: 32, height: 32, backgroundColor: '#e0e7ff', borderRadius: 6}}></div>
          )}
          <BrandName>{admin?.name || 'Event Manager'}</BrandName>
        </BrandSection>
        <UserMenu>
          <UserEmailDisplay>{admin?.email}</UserEmailDisplay>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserMenu>
      </TopBar>

      <Sidebar isOpen={isSidebarOpen}>
        <NavList>
          <NavItem to="/" end>
            Dashboard Overview
          </NavItem>
          {/* Future links: Settings, Billing, etc. */}
        </NavList>
      </Sidebar>
      
      <MobileOverlay isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />
      
      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
}

export default App;
