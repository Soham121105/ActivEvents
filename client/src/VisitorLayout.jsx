import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useVisitorAuth } from './context/VisitorAuthContext';

// --- STYLES ---

const GlobalStyle = createGlobalStyle`
  :root { --primary: #6366f1; --bg: #f8fafc; --text: #0f172a; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
  * { box-sizing: border-box; }
`;
const Container = styled.div`
  max-width: 480px; margin: 0 auto; min-height: 100vh; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
`;

// --- HEADER ---
const Header = styled.header`
  background: white; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`;
const Brand = styled.div`
  display: flex; align-items: center; gap: 12px;
  grid-column: 1 / 2;
  min-width: 0; /* Fix for flexbox overflow */
`;
const Logo = styled.img`
  width: 36px; height: 36px; border-radius: 8px; object-fit: contain; border: 1px solid #f1f5f9;
`;
const Info = styled.div`
  display: flex; flex-direction: column;
  min-width: 0; /* Fix for flexbox overflow */
`;
const ClubName = styled.h1`
  font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const EventName = styled.span`
  font-size: 0.75rem; color: #64748b; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const WalletWidget = styled.div`
  text-align: center;
  grid-column: 2 / 3;
`;
const BalanceLabel = styled.div`
  font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 600;
`;
const BalanceValue = styled.div`
  font-size: 1.1rem; font-weight: 800; color: var(--primary);
`;
const HeaderActions = styled.div`
  grid-column: 3 / 4;
  text-align: right;
`;
const LogoutButton = styled.button`
  background: none; border: none; color: #64748b; font-weight: 600; font-size: 0.8rem;
  cursor: pointer; padding: 8px;
  &:hover { color: #dc2626; }
`;

// --- MAIN CONTENT ---
const Main = styled.main`
  flex: 1;
  padding-bottom: 80px; // Space for bottom nav
`;

// --- BOTTOM NAV ---
const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 64px;
  z-index: 20; /* Ensure it's above content */
`;

const NavItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  gap: 4px;

  &.active {
    color: var(--primary);
    background-color: #f8fafc;
  }
`;

const Icon = ({ path }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
// --- End of Styles ---


export default function VisitorLayout() {
  // --- FIX: Get the 'loading' state from the context ---
  const { wallet, visitor, logout, loading } = useVisitorAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStallId, setActiveStallId] = useState(null);

  useEffect(() => {
    // --- FIX: This effect now safely handles auth redirection ---
    // If loading is finished AND we still don't have a visitor, they are not logged in.
    if (!loading && !visitor) {
      // User is not logged in. Redirect to a safe, public page.
      // We can't use visitor.url_slug here, so we redirect to a generic login.
      navigate('/admin-login'); 
    }
  }, [loading, visitor, navigate]); // This effect runs when loading or visitor changes

  useEffect(() => {
    const match = location.pathname.match(/\/v\/stall\/([a-fA-F0-9-]+)/);
    if (match && match[1]) {
      setActiveStallId(match[1]);
    }
  }, [location.pathname]);

  // --- FIX: This function is now safe ---
  // It is only called onClick, at which point 'visitor' is guaranteed to exist
  // because the LogoutButton won't be rendered otherwise.
  const handleLogout = () => {
    if (visitor) {
      const slug = visitor.url_slug;
      const event = visitor.event_id;
      logout();
      navigate(`/${slug}/v/login?event=${event}`);
    } else {
      // Failsafe
      logout();
      navigate('/admin-login');
    }
  };

  // --- FIX: Add guard clauses BEFORE render ---
  // This is the most important part.
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
        Loading Wallet...
      </div>
    );
  }

  // If loading is done and we still have no user, render nothing.
  // The useEffect above will handle the redirect.
  if (!visitor || !wallet) {
    return null;
  }

  // --- Main render (Now safe from crashes) ---
  // This code will only run AFTER 'loading' is false AND
  // 'visitor' and 'wallet' are confirmed to exist.
  return (
    <Container>
      <GlobalStyle />
      <Header>
        <Brand>
          <Logo 
            src={visitor.club_logo_url} 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <Info>
            <ClubName>{visitor.club_name}</ClubName>
            <EventName>{visitor.event_name}</EventName>
          </Info>
        </Brand>
        <WalletWidget>
           <BalanceLabel>Balance</BalanceLabel>
           <BalanceValue>₹{parseFloat(wallet.current_balance).toFixed(0)}</BalanceValue>
        </WalletWidget>
        <HeaderActions>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </HeaderActions>
      </Header>
      
      <Main>
        <Outlet />
      </Main>

      <BottomNav>
        <NavItem 
          to={activeStallId ? `/v/stall/${activeStallId}` : '#'} 
          style={!activeStallId ? { opacity: 0.5, pointerEvents: 'none'} : {}}
          // Prevent NavLink from being "active" when on wallet page
          isActive={() => location.pathname.includes('/v/stall/')}
        >
          <Icon path="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
          <span>Menu</span>
        </NavItem>
        <NavItem to="/v/wallet">
          <Icon path="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          <span>Wallet</span>
        </NavItem>
      </BottomNav>
    </Container>
  );
}
