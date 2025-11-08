import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useAuth } from './context/AuthContext';

// --- Private Route Hook ---
const usePrivateRoute = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate('/stall-login');
    }
  }, [token, navigate]);
};

// --- Styling ---
const GlobalStyle = createGlobalStyle`
  body { margin: 0; padding: 0; background-color: #f9fafb; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
`;
const AppLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;
const Sidebar = styled.nav`
  width: 240px;
  background-color: white;
  border-right: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
`;
const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 32px;
`;
const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;
const NavItem = styled.li`
  margin-bottom: 8px;
  a {
    display: block;
    padding: 12px 16px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    color: #374151;
    transition: all 0.2s;
    &:hover {
      background-color: #f3f4f6;
    }
    &.active {
      background-color: #f0fdf4; /* Green accent */
      color: #15803d;
    }
  }
`;
const MainContent = styled.main`
  flex-grow: 1;
  padding: 32px 48px;
  overflow-y: auto;
`;
const LogoutButton = styled.button`
  display: block;
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
// --- End of Styling ---

function StallLayout() {
  usePrivateRoute(); 
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/stall-login');
  };

  return (
    <AppLayout>
      <GlobalStyle />
      <Sidebar>
        <LogoText>Stall Dashboard</LogoText>
        <NavList>
          
          {/* "Quick POS" is now the main dashboard page */}
          <NavItem>
            <NavLink to="/stall/pos" end>
              Point of Sale
            </NavLink>
          </NavItem>
          
          <NavItem>
            <NavLink to="/stall/menu">
              Manage Menu
            </NavLink>
          </NavItem>
          
          <NavItem>
            <NavLink to="/stall/transactions">
              Transactions
            </NavLink>
          </NavItem>
          
          <NavItem>
            <NavLink to="/stall/qr">
              Event QR Code
            </NavLink>
          </NavItem>
          
          {/* We've removed the "Live Dashboard (KDS)" link */}

        </NavList>
        
        <NavItem style={{ marginTop: 'auto' }}> 
          <LogoutButton onClick={handleLogout}>
            Logout
          </LogoutButton>
        </NavItem>

      </Sidebar>
      
      <MainContent>
        <Outlet />
      </MainContent>

    </AppLayout>
  );
}

export default StallLayout;
