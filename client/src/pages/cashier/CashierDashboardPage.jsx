import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { cashierAxios } from '../../utils/apiAdapters';
import { useNavigate, Link } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

// --- PRIVATE ROUTE HOOK ---
const usePrivateRoute = () => {
  const { token, cashier } = useCashierAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      const clubSlug = cashier?.url_slug; 
      if (clubSlug) {
        navigate(`/${clubSlug}/cashier-login`);
      } else {
        navigate('/admin-login'); 
      }
    }
  }, [token, navigate, cashier]);
};

// --- ANIMATIONS ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const scaleIn = keyframes`from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }`;

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  display: flex; flex-direction: column; min-height: 100vh; background-color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Header = styled.header`
  background: white; padding: 16px 32px; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  @media (max-width: 640px) { padding: 16px; }
`;

const BrandSection = styled.div`
  display: flex; align-items: center; gap: 16px;
`;

const ClubLogo = styled.img`
  height: 40px; width: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;
`;

const BrandInfo = styled.div`
  display: flex; flex-direction: column;
`;

const ClubName = styled.h1`
  font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.2;
`;

const EventName = styled.span`
  font-size: 0.85rem; font-weight: 500; color: #64748b;
`;

const HeaderActions = styled.div`
  display: flex; align-items: center; gap: 24px;
`;

const NavLinkStyled = styled(Link)`
  color: #6366f1; font-weight: 600; text-decoration: none; transition: color 0.2s;
  display: none;
  @media (min-width: 768px) { display: block; }
  &:hover { color: #4f46e5; text-decoration: underline; }
`;

const LogoutButton = styled.button`
  background-color: #f1f5f9; color: #475569; font-weight: 600; padding: 10px 16px;
  border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s;
  &:hover { background-color: #fee2e2; color: #991b1b; border-color: #fca5a5; }
`;

const MainContent = styled.main`
  flex: 1; padding: 32px; max-width: 1200px; margin: 0 auto; width: 100%;
  display: grid; grid-template-columns: 1fr 380px; gap: 32px;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
  @media (max-width: 640px) { padding: 16px; gap: 24px; }
`;

const Widget = styled.section`
  background: white; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0; overflow: hidden; animation: ${fadeIn} 0.5s ease-out;
`;

const WidgetHeader = styled.div`
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background-color: #fcfcfc;
`;

const WidgetTitle = styled.h2`
  font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;
`;

const WidgetBody = styled.div`
  padding: 24px;
`;

// --- FORM ELEMENTS ---
const Form = styled.form`
  display: flex; flex-direction: column; gap: 20px;
`;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 8px;
`;

const Label = styled.label`
  font-size: 0.9rem; font-weight: 600; color: #334155;
`;

const Input = styled.input`
  padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.1rem; color: #0f172a; transition: all 0.2s;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
  &::placeholder { color: #94a3b8; }
`;

const ActionButton = styled.button`
  padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; border: none; transition: all 0.2s;
  background-color: #6366f1; color: white;
  &:hover:not(:disabled) { background-color: #4f46e5; transform: translateY(-2px); }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { background-color: #94a3b8; cursor: not-allowed; opacity: 0.7; }
`;

const SecondaryActions = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; padding-top: 24px; border-top: 1px solid #f1f5f9;
`;

const SecondaryButton = styled(ActionButton)`
  background-color: white; border: 2px solid #e2e8f0; color: #475569; font-size: 1rem; padding: 12px;
  &:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
`;

const RefundButtonStyled = styled(SecondaryButton)`
  color: #dc2626; border-color: #fecaca;
  &:hover:not(:disabled) { background-color: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
`;

// --- TOGGLE SWITCH ---
const ToggleWrapper = styled.label`
  display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
`;
const ToggleSwitch = styled.div`
  position: relative; width: 48px; height: 26px; background-color: ${props => props.checked ? '#6366f1' : '#cbd5e1'}; border-radius: 99px; transition: all 0.2s;
  &::after {
    content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background-color: white; border-radius: 50%;
    transform: translateX(${props => props.checked ? '22px' : '0'}); transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
`;

// --- MODAL ---
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 50; animation: ${fadeIn} 0.2s ease-out;
`;
const ModalContent = styled.div`
  background: white; width: 90%; max-width: 440px; padding: 32px; border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); text-align: center; animation: ${scaleIn} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
`;
const ModalIcon = styled.div`
  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px;
  &.success { background: #dcfce7; color: #16a34a; }
  &.error { background: #fee2e2; color: #dc2626; }
`;
const ModalTitle = styled.h3`
  font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;
`;
const ModalText = styled.p`
  font-size: 1.1rem; color: #475569; margin: 0 0 24px 0; line-height: 1.5;
`;
const CloseButton = styled(ActionButton)`
  width: 100%; background-color: #0f172a;
  &:hover { background-color: #334155; }
`;

// --- NEW: PinDisplay for Success Modal ---
const NewPinDisplay = styled.div`
  background-color: #eef2ff;
  border: 2px dashed #6366f1;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  margin-top: 16px;
`;
const PinLabel = styled.div`
  font-size: 0.875rem; color: #4f46e5; font-weight: 600; margin-bottom: 4px;
`;
const PinValue = styled.div`
  font-size: 2.5rem; font-weight: 900; color: #111827; letter-spacing: 4px;
`;

// --- RECENT ACTIVITY WIDGET ---
const ActivityList = styled.ul`
  list-style: none; padding: 0; margin: 0;
`;
const ActivityItem = styled.li`
  padding: 16px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;
  &:last-child { border-bottom: none; }
`;
const ActivityInfo = styled.div`
  display: flex; flex-direction: column; gap: 4px;
`;
const ActivityType = styled.span`
  font-weight: 600; font-size: 0.95rem; color: #334155; text-transform: capitalize;
  &.topup { color: #059669; } &.refund { color: #dc2626; }
`;
const ActivityMeta = styled.span`
  font-size: 0.8rem; color: #94a3b8;
`;
const ActivityAmount = styled.span`
  font-weight: 700; font-size: 1.1rem; color: #0f172a;
`;

export default function CashierDashboardPage() {
  usePrivateRoute();
  const { logout, cashier } = useCashierAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [membershipId, setMembershipId] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); 
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    try {
      const res = await cashierAxios.get('/cashier/log');
      // FIX: Safe access to logs array
      setRecentLogs(res.data.logs?.slice(0, 5) || []); 
    } catch (err) { 
      console.error("Failed to fetch logs", err); 
    }
  };

  const handleLogout = () => {
    logout();
    const clubSlug = cashier?.url_slug;
    navigate(clubSlug ? `/${clubSlug}/cashier-login` : '/admin-login');
  };

  const closeModal = () => setModal(null);

  const handleCheckBalance = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/check-balance', { visitor_phone: phone });
      setModal({
        type: 'success',
        title: 'Wallet Balance',
        text: `Current balance for ${phone} is ₹${parseFloat(res.data.current_balance || 0).toFixed(2)}`
      });
    } catch (err) {
      setModal({ type: 'error', title: 'Error', text: err.response?.data?.error || "Failed to check balance." });
    } finally { setLoading(false); }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/topup', {
        visitor_phone: phone,
        amount: parseFloat(amount),
        visitor_name: visitorName,
        membership_id: isMember ? membershipId : null
      });
      setModal({
        type: 'success',
        title: 'Top-Up Successful',
        text: `New balance: ₹${parseFloat(res.data.new_balance).toFixed(2)}`,
        pin: res.data.new_pin 
      });
      setPhone(''); setAmount(''); setVisitorName(''); setIsMember(false); setMembershipId('');
      fetchRecentLogs();
    } catch (err) {
      setModal({ type: 'error', title: 'Top-Up Failed', text: err.response?.data?.error || "Could not process top-up." });
    } finally { setLoading(false); }
  };

  const handleRefund = async () => {
    if (!phone || !window.confirm(`Confirm FULL refund for ${phone}?`)) return;
    setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/refund', { visitor_phone: phone });
      setModal({
        type: 'success',
        title: 'Refund Complete',
        text: `Refunded ₹${parseFloat(res.data.refundedAmount).toFixed(2)} in cash to customer.`
      });
      setPhone('');
      fetchRecentLogs();
    } catch (err) {
      setModal({ type: 'error', title: 'Refund Failed', text: err.response?.data?.error || "Could not process refund." });
    } finally { setLoading(false); }
  };

  return (
    <PageContainer>
      <Header>
        <BrandSection>
          {cashier?.club_logo_url ? <ClubLogo src={cashier.club_logo_url} /> : <div style={{width:40, height:40, background:'#e2e8f0', borderRadius:8}} />}
          <BrandInfo>
            <ClubName>{cashier?.club_name || 'Event Cashier'}</ClubName>
            <EventName>{cashier?.event_name}</EventName>
          </BrandInfo>
        </BrandSection>
        <HeaderActions>
          <NavLinkStyled to="/cashier/log">View Full Log →</NavLinkStyled>
          <LogoutButton onClick={handleLogout}>Logout ({cashier?.name || 'Cashier'})</LogoutButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <Widget>
          <WidgetHeader><WidgetTitle>💸 Wallet Operations</WidgetTitle></WidgetHeader>
          <WidgetBody>
            <Form onSubmit={handleTopUp}>
              <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px'}}>
                <InputGroup>
                  <Label>Phone Number *</Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" required autoFocus />
                </InputGroup>
                <InputGroup>
                  <Label>Amount (₹) *</Label>
                  <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" required />
                </InputGroup>
              </div>

              <InputGroup>
                <Label>Visitor Name (Optional)</Label>
                <Input type="text" value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="e.g. Rahul" />
              </InputGroup>

              <ToggleWrapper>
                <input type="checkbox" checked={isMember} onChange={e => setIsMember(e.target.checked)} style={{display: 'none'}} />
                <ToggleSwitch checked={isMember} />
                <span style={{fontWeight: 600, color: '#334155'}}>Is Club Member?</span>
              </ToggleWrapper>

              {isMember && (
                <InputGroup style={{animation: `${fadeIn} 0.3s ease-out`}}>
                  <Label>Membership ID *</Label>
                  <Input type="text" value={membershipId} onChange={e => setMembershipId(e.target.value)} placeholder="e.g. MEM123" required={isMember} />
                </InputGroup>
              )}

              <ActionButton type="submit" disabled={loading || !phone || !amount}>
                {loading ? 'Processing...' : 'Confirm Top-Up'}
              </ActionButton>
            </Form>

            <SecondaryActions>
              <SecondaryButton type="button" onClick={handleCheckBalance} disabled={loading || !phone}>
                🔍 Check Balance
              </SecondaryButton>
              <RefundButtonStyled type="button" onClick={handleRefund} disabled={loading || !phone}>
                ↩️ Full Refund
              </RefundButtonStyled>
            </SecondaryActions>
          </WidgetBody>
        </Widget>

        <Widget>
          <WidgetHeader><WidgetTitle>🕒 Recent Activity</WidgetTitle></WidgetHeader>
          <WidgetBody style={{paddingTop: 0}}>
            {recentLogs.length === 0 ? (
              <p style={{color: '#94a3b8', textAlign: 'center', marginTop: '24px'}}>No transactions yet.</p>
            ) : (
              <ActivityList>
                {recentLogs.map(log => (
                  <ActivityItem key={log.cash_ledger_id}>
                    <ActivityInfo>
                      {/* FIX: Safe access to transaction_type */}
                      <ActivityType className={(log.transaction_type || '').toLowerCase()}>
                        {log.transaction_type}
                      </ActivityType>
                      <ActivityMeta>
                        {log.visitor_phone} • {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </ActivityMeta>
                    </ActivityInfo>
                    <ActivityAmount>₹{parseFloat(log.amount).toFixed(0)}</ActivityAmount>
                  </ActivityItem>
                ))}
              </ActivityList>
            )}
          </WidgetBody>
        </Widget>
      </MainContent>

      {modal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalIcon className={modal.type}>{modal.type === 'success' ? '✓' : '✕'}</ModalIcon>
            <ModalTitle>{modal.title}</ModalTitle>
            <ModalText>{modal.text}</ModalText>
            {modal.pin && (
              <NewPinDisplay>
                <PinLabel>VISITOR LOGIN PIN:</PinLabel>
                <PinValue>{modal.pin}</PinValue>
                <small style={{color: '#6b7280', display: 'block', marginTop: '8px'}}>Tell the visitor to use this PIN to log in.</small>
              </NewPinDisplay>
            )}
            <CloseButton onClick={closeModal} style={{marginTop: '24px'}}>Done</CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}