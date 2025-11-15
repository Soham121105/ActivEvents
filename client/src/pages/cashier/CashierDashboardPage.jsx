import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { cashierAxios } from '../../utils/apiAdapters';
import { useNavigate, Link } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

// --- STYLES (largely unchanged, with minor additions) ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const PageContainer = styled.div`display: flex; flex-direction: column; min-height: 100vh; background-color: #f8fafc;`;
const Header = styled.header`background: white; padding: 16px 32px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;`;
const BrandInfo = styled.div`display: flex; flex-direction: column;`;
const ClubName = styled.h1`font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0;`;
const LogoutBtn = styled.button`background: #f1f5f9; color: #475569; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; &:hover { background: #e2e8f0; }`;
const Main = styled.main`flex: 1; padding: 32px; max-width: 1200px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1fr 380px; gap: 32px; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Widget = styled.section`background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); animation: ${fadeIn} 0.5s ease-out;`;
const WidgetHead = styled.div`padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: #fcfcfc; font-weight: 700; font-size: 1.25rem; color: #0f172a;`;
const WidgetBody = styled.div`padding: 24px; display: flex; flex-direction: column; gap: 24px;`;
const InputGroup = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const Label = styled.label`font-size: 0.9rem; font-weight: 600; color: #334155;`;
const Input = styled.input`padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.1rem; &:focus { outline: none; border-color: #6366f1; }`;

// --- NEW STYLES ---
const IdentifierToggle = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f1f5f9; padding: 6px; border-radius: 12px;`;
const ToggleBtn = styled.button`
  padding: 10px; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  background: ${p => p.active ? 'white' : 'transparent'};
  color: ${p => p.active ? '#4f46e5' : '#475569'};
  box-shadow: ${p => p.active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'};
  transition: all 0.2s ease;
`;
const ButtonGroup = styled.div`display: flex; flex-direction: column; gap: 12px; margin-top: 8px;`;
const ActionBtn = styled.button`
  padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; border: none;
  background: ${p => p.primary ? '#6366f1' : (p.danger ? '#fee2e2' : '#f1f5f9')};
  color: ${p => p.primary ? 'white' : (p.danger ? '#dc2626' : '#1e293b')};
  width: 100%; transition: all 0.2s;
  &:hover:not(:disabled) { background: ${p => p.primary ? '#4f46e5' : (p.danger ? '#fecaca' : '#e2e8f0')}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
// --- END NEW STYLES ---

const ModalBG = styled.div`position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; animation: ${fadeIn} 0.2s;`;
const ModalCard = styled.div`background: white; width: 90%; max-width: 400px; padding: 32px; border-radius: 24px; text-align: center; animation: ${fadeIn} 0.3s ease-out;`;
const LogList = styled.ul`list-style: none; padding: 0; margin: 0;`;
const LogItem = styled.li`padding: 16px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-weight: 500;`;


export default function CashierDashboardPage() {
  const { token, cashier, logout } = useCashierAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!token) navigate('/admin-login'); }, [token]);

  // --- REFACTORED STATE ---
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('phone'); // 'phone' or 'member'
  const [amount, setAmount] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null); // { type, title, text }

  // ---UNCHANGED: Fetch recent logs on load ---
  useEffect(() => { fetchLogs(); }, []);
  const fetchLogs = async () => { try { const res = await cashierAxios.get('/cashier/log'); setLogs(res.data.logs?.slice(0,5)||[]); } catch(e) {} };
  
  const clearForm = () => {
    setIdentifier('');
    setAmount('');
  };

  // --- NEW: Check Balance Handler ---
  const handleCheckBalance = async () => {
    setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/check-balance', { identifier, identifierType });
      setModal({ 
        type: 'success', 
        title: 'Balance Found', 
        text: `${res.data.name || 'Visitor'} (${res.data.phone}) has a balance of ₹${res.data.current_balance}.` 
      });
    } catch (err) {
      setModal({ type: 'error', title: 'Error', text: err.response?.data?.error || 'Could not check balance' });
    }
    setLoading(false);
  };

  // --- UPDATED: Top-Up Handler ---
  const handleTopUp = async () => {
    if (!amount) {
      setModal({ type: 'error', title: 'Error', text: 'Please enter an amount to top-up.' });
      return;
    }
    setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/topup', {
        identifier, 
        identifierType, 
        amount: parseFloat(amount) 
      });
      setModal({ type: 'success', title: 'Top-Up Successful', text: `${res.data.name}'s new balance is ₹${res.data.new_balance}.` });
      clearForm();
      fetchLogs(); // Refresh recent activity
    } catch (err) { 
      setModal({ type: 'error', title: 'Top-Up Failed', text: err.response?.data?.error || 'Error processing top-up' }); 
    }
    setLoading(false);
  };

  // --- NEW: Refund Handler ---
  const handleRefund = async () => {
    if (!window.confirm(`Are you sure you want to refund the ENTIRE remaining balance for ${identifier}? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/refund', { identifier, identifierType });
      const memberMsg = res.data.isMember ? 'This amount will be credited to their membership card.' : '';
      setModal({ 
        type: 'success', 
        title: 'Refund Successful', 
        text: `Refunded ₹${res.data.refundedAmount} to ${res.data.name || 'Visitor'}. ${memberMsg}` 
      });
      clearForm();
      fetchLogs(); // Refresh recent activity
    } catch (err) {
      setModal({ type: 'error', title: 'Refund Failed', text: err.response?.data?.error || 'Error processing refund' });
    }
    setLoading(false);
  };


  return (
    <PageContainer>
      <Header>
        <BrandInfo><ClubName>{cashier?.club_name}</ClubName><span style={{color:'#64748b', fontSize:'0.9rem'}}>{cashier?.event_name}</span></BrandInfo>
        <div style={{display:'flex', gap:16, alignItems:'center'}}>
           <Link to="/cashier/log" style={{fontWeight:600, color:'#6366f1', textDecoration:'none'}}>View Full Log</Link>
           <LogoutBtn onClick={() => { logout(); navigate(`/${cashier?.url_slug}/cashier-login`); }}>Logout</LogoutBtn>
        </div>
      </Header>
      <Main>
        <Widget>
          <WidgetHead>💸 Cashier Terminal</WidgetHead>
          <WidgetBody>
            
            <InputGroup>
              <Label>Identifier Type</Label>
              <IdentifierToggle>
                <ToggleBtn active={identifierType === 'phone'} onClick={() => setIdentifierType('phone')}>Phone Number</ToggleBtn>
                <ToggleBtn active={identifierType === 'member'} onClick={() => setIdentifierType('member')}>Membership ID</ToggleBtn>
              </IdentifierToggle>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="identifier">{identifierType === 'phone' ? 'Visitor Phone Number' : 'Visitor Membership ID'}</Label>
              <Input 
                id="identifier"
                type={identifierType === 'phone' ? 'tel' : 'text'}
                placeholder={identifierType === 'phone' ? '9876543210' : 'MEMBER-123'}
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                required 
                autoFocus
              />
            </InputGroup>
            
            <hr style={{border: 'none', borderTop: '1px solid #f1f5f9'}} />

            <InputGroup>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input 
                id="amount"
                type="number" 
                placeholder="e.g., 500"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
            </InputGroup>
            
            <ButtonGroup>
              <ActionBtn onClick={handleTopUp} primary disabled={loading || !identifier || !amount}>
                Top-Up Wallet
              </ActionBtn>
              <ActionBtn onClick={handleCheckBalance} disabled={loading || !identifier}>
                Check Balance
              </ActionBtn>
              <ActionBtn onClick={handleRefund} danger disabled={loading || !identifier}>
                Refund Full Amount
              </ActionBtn>
            </ButtonGroup>

          </WidgetBody>
        </Widget>
        <Widget>
          <WidgetHead>Recent Activity</WidgetHead>
          <WidgetBody>
            <LogList>
              {logs.map(l => (
                <LogItem key={l.cash_ledger_id}>
                  <div><div style={{color: l.transaction_type==='TOPUP'?'#059669':'#dc2626', textTransform: 'capitalize'}}>{l.transaction_type.toLowerCase()}</div><small style={{color:'#94a3b8'}}>{l.visitor_phone}</small></div>
                  <div style={{fontSize:'1.1rem'}}>₹{parseFloat(l.amount).toFixed(0)}</div>
                </LogItem>
              ))}
              {logs.length===0 && <p style={{color:'#94a3b8', textAlign:'center'}}>No activity yet.</p>}
            </LogList>
          </WidgetBody>
        </Widget>
      </Main>
      {modal && (
        <ModalBG onClick={()=>setModal(null)}>
          <ModalCard onClick={e=>e.stopPropagation()}>
            <div style={{fontSize: '3rem', marginBottom: 16}}>{modal.type==='success'?'✅':'❌'}</div>
            <h2 style={{margin: '0 0 12px 0'}}>{modal.title}</h2>
            <p style={{fontSize:'1.1rem', color:'#64748b', marginBottom: 24, lineHeight: 1.6}}>{modal.text}</p>
            {/* --- REMOVED PIN SECTION --- */}
            <ActionBtn onClick={()=>setModal(null)} style={{background:'#0f172a'}}>Done</ActionBtn>
          </ModalCard>
        </ModalBG>
      )}
    </PageContainer>
  );
}
