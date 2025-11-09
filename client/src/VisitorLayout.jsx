import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useVisitorAuth } from './context/VisitorAuthContext';

const GlobalStyle = createGlobalStyle`
  :root { --primary: #6366f1; --bg: #f8fafc; --text: #0f172a; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
  * { box-sizing: border-box; }
`;
const Container = styled.div`
  max-width: 480px; margin: 0 auto; min-height: 100vh; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.05);
  display: flex; flex-direction: column;
`;
const Header = styled.header`
  background: white; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
`;
const Brand = styled.div`
  display: flex; align-items: center; gap: 12px;
`;
const Logo = styled.img`
  width: 36px; height: 36px; border-radius: 8px; object-fit: contain; border: 1px solid #f1f5f9;
`;
const Info = styled.div`
  display: flex; flex-direction: column;
`;
const ClubName = styled.h1`
  font-size: 1rem; font-weight: 700; margin: 0; line-height: 1.2;
`;
const EventName = styled.span`
  font-size: 0.75rem; color: #64748b; font-weight: 500;
`;
const WalletWidget = styled.div`
  text-align: right;
`;
const BalanceLabel = styled.div`
  font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 600;
`;
const BalanceValue = styled.div`
  font-size: 1.1rem; font-weight: 800; color: var(--primary);
`;
const Main = styled.main`
  flex: 1;
  padding-bottom: 80px; // Space for bottom nav if needed
`;

export default function VisitorLayout() {
  const { wallet, visitor } = useVisitorAuth();
  // visitor object now contains branding info from the token
  
  return (
    <Container>
      <GlobalStyle />
      {visitor && (
        <Header>
          <Brand>
            {visitor.club_logo_url && <Logo src={visitor.club_logo_url} />}
            <Info>
              <ClubName>{visitor.club_name}</ClubName>
              <EventName>{visitor.event_name}</EventName>
            </Info>
          </Brand>
          <WalletWidget>
             <BalanceLabel>Balance</BalanceLabel>
             <BalanceValue>₹{wallet ? parseFloat(wallet.current_balance).toFixed(2) : '...'}</BalanceValue>
          </WalletWidget>
        </Header>
      )}
      <Main>
        <Outlet />
      </Main>
      {/* Add Bottom Navigation here later if you want tabs */}
    </Container>
  );
}