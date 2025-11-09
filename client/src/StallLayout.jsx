import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useAuth } from './context/AuthContext';

// --- Private Route Hook ---
const usePrivateRoute = () => {
  const { token, stall } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      // Use the slug if available, otherwise try to grab it from URL, fallback to home
      const slug = stall?.url_slug || window.location.pathname.split('/')[1] || '';
       navigate(`/${slug}/stall-login`);
    }
  }, [token, navigate, stall]);
};

// --- Styling ---
const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #4f46e5;
    --bg-main: #f9fafb;
    --text-main: #111827;
  }
  body { 
    margin: 0; padding: 0; background-color: var(--bg-main); color: var(--text-main); 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; }
`;

const AppLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.nav`
  width: 260px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
`;

const LogoSection = styled.div`
  margin-bottom: 32px;
  padding: 0 12px;
`;

const LogoText = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.025em;
`;

const ClubName = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-top: 4px;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled.li`
  a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    color: #4b5563;
    transition: all 0.15s ease;

    &:hover {
      background-color: #f3f4f6;
      color: var(--text-main);
    }
    &.active {
      background-color: #eef2ff;
      color: var(--primary);
    }
  }
`;

const MainContent = styled.main`
  flex-grow: 1;
  margin-left: 260px; /* Offset for fixed sidebar */
  padding: 32px;
  width: calc(100% - 260px);
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #4b5563;
  transition: all 0.15s ease;
  background-color: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    background-color: #fee2e2;
    color: #991b1b;
  }
`;

function StallLayout() {
  usePrivateRoute(); 
  const { logout, stall } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    const slug = stall?.url_slug || '';
    navigate(`/${slug}/stall-login`);
  };

  return (
    <AppLayout>
      <GlobalStyle />
      <Sidebar>
        <LogoSection>
          <LogoText>{stall?.name || 'Stall Portal'}</LogoText>
          {stall?.club_name && <ClubName>{stall.club_name}</ClubName>}
        </LogoSection>

        <NavList>
          <NavItem>
            <NavLink to="/stall/pos" end>Live Orders (KDS)</NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/stall/menu">Menu Management</NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/stall/transactions">Sales History</NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/stall/qr">Stall QR Code</NavLink>
          </NavItem>
          
          {/* Divider for Settings */}
          <li style={{height: '1px', backgroundColor: '#e5e7eb', margin: '24px 0'}}></li>
          
          <NavItem>
            <NavLink to="/stall/settings">Stall Settings</NavLink>
          </NavItem>
        </NavList>
        
        <div style={{ marginTop: 'auto', paddingTop: '24px' }}> 
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
        </div>
      </Sidebar>
      
      <MainContent>
        <Outlet />
      </MainContent>
    </AppLayout>
  );
}

export default StallLayout;
