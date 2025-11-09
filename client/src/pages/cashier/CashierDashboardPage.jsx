import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { cashierAxios } from '../../utils/apiAdapters';
import { useNavigate, Link } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const PageContainer = styled.div`display: flex; flex-direction: column; min-height: 100vh; background-color: #f8fafc;`;
const Header = styled.header`background: white; padding: 16px 32px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;`;
const BrandInfo = styled.div`display: flex; flex-direction: column;`;
const ClubName = styled.h1`font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0;`;
const LogoutBtn = styled.button`background: #f1f5f9; color: #475569; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; &:hover { background: #e2e8f0; }`;
const Main = styled.main`flex: 1; padding: 32px; max-width: 1200px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1fr 380px; gap: 32px; @media (max-width: 1024px) { grid-template-columns: 1fr; }`;
const Widget = styled.section`background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);`;
const WidgetHead = styled.div`padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: #fcfcfc; font-weight: 700; font-size: 1.25rem; color: #0f172a;`;
const WidgetBody = styled.div`padding: 24px;`;
const InputGroup = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const Label = styled.label`font-size: 0.9rem; font-weight: 600; color: #334155;`;
const Input = styled.input`padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.1rem; &:focus { outline: none; border-color: #6366f1; }`;
const ActionBtn = styled.button`padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; border: none; background: #6366f1; color: white; width: 100%; transition: all 0.2s; &:hover:not(:disabled) { background: #4f46e5; } &:disabled { opacity: 0.5; }`;
const ToggleWrap = styled.label`display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin: 10px 0;`;
const Toggle = styled.div`position: relative; width: 48px; height: 26px; background: ${p => p.checked ? '#6366f1' : '#cbd5e1'}; border-radius: 99px; transition: all 0.2s; &::after { content:''; position: absolute; top:3px; left:3px; width:20px; height:20px; background:white; border-radius:50%; transform: translateX(${p => p.checked ? '22px' : '0'}); transition: all 0.2s; }`;
const ModalBG = styled.div`position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;`;
const ModalCard = styled.div`background: white; width: 90%; max-width: 400px; padding: 32px; border-radius: 24px; text-align: center; animation: ${fadeIn} 0.3s ease-out;`;
const LogList = styled.ul`list-style: none; padding: 0; margin: 0;`;
const LogItem = styled.li`padding: 16px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-weight: 500;`;

export default function CashierDashboardPage() {
  const { token, cashier, logout } = useCashierAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!token) navigate('/admin-login'); }, [token]);

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [memId, setMemId] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchLogs(); }, []);
  const fetchLogs = async () => { try { const res = await cashierAxios.get('/cashier/log'); setLogs(res.data.logs?.slice(0,5)||[]); } catch(e) {} };

  const handleTopUp = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await cashierAxios.post('/cashier/topup', {
        visitor_phone: phone,
        amount: parseFloat(amount),
        visitor_name: name || null,
        membership_id: isMember && memId ? memId : null // Safely handle membership ID
      });
      setModal({ type: 'success', title: 'Top-Up Successful', text: `New Balance: ₹${res.data.new_balance}`, pin: res.data.new_pin });
      setPhone(''); setAmount(''); setName(''); setIsMember(false); setMemId(''); fetchLogs();
    } catch (err) { setModal({ type: 'error', title: 'Failed', text: err.response?.data?.error || 'Error processing top-up' }); }
    finally { setLoading(false); }
  };

  return (
    <PageContainer>
      <Header>
        <BrandInfo><ClubName>{cashier?.club_name}</ClubName><span style={{color:'#64748b', fontSize:'0.9rem'}}>{cashier?.event_name}</span></BrandInfo>
        <div style={{display:'flex', gap:16, alignItems:'center'}}>
           <Link to="/cashier/log" style={{fontWeight:600, color:'#6366f1', textDecoration:'none'}}>View Log</Link>
           <LogoutBtn onClick={() => { logout(); navigate(`/${cashier?.url_slug}/cashier-login`); }}>Logout</LogoutBtn>
        </div>
      </Header>
      <Main>
        <Widget>
          <WidgetHead>💸 Top-Up Wallet</WidgetHead>
          <WidgetBody>
            <form onSubmit={handleTopUp} style={{display:'flex', flexDirection:'column', gap:20}}>
              <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16}}>
                <InputGroup><Label>Phone *</Label><Input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required autoFocus/></InputGroup>
                <InputGroup><Label>Amount (₹) *</Label><Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required/></InputGroup>
              </div>
              <InputGroup><Label>Name (Optional)</Label><Input value={name} onChange={e=>setName(e.target.value)}/></InputGroup>
              <ToggleWrap>
                <input type="checkbox" checked={isMember} onChange={e=>setIsMember(e.target.checked)} style={{display:'none'}}/>
                <Toggle checked={isMember}/> <span style={{fontWeight:600, color:'#334155'}}>Club Member?</span>
              </ToggleWrap>
              {isMember && <InputGroup><Label>Membership ID *</Label><Input value={memId} onChange={e=>setMemId(e.target.value)} required={isMember}/></InputGroup>}
              <ActionBtn type="submit" disabled={loading || !phone || !amount}>{loading ? 'Processing...' : 'Confirm Top-Up'}</ActionBtn>
            </form>
          </WidgetBody>
        </Widget>
        <Widget>
          <WidgetHead>Recent Activity</WidgetHead>
          <WidgetBody>
            <LogList>
              {logs.map(l => (
                <LogItem key={l.cash_ledger_id}>
                  <div><div style={{color: l.transaction_type==='TOPUP'?'#059669':'#dc2626'}}>{l.transaction_type}</div><small style={{color:'#94a3b8'}}>{l.visitor_phone}</small></div>
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
            <p style={{fontSize:'1.1rem', color:'#64748b', marginBottom: 24}}>{modal.text}</p>
            {modal.pin && <div style={{background:'#eef2ff', padding:16, borderRadius:12, marginBottom:24, border:'2px dashed #6366f1'}}>
              <div style={{color:'#4f46e5', fontWeight:700, fontSize:'0.9rem'}}>NEW PIN GENERATED</div>
              <div style={{fontSize:'2.5rem', fontWeight:900, letterSpacing:4}}>{modal.pin}</div>
            </div>}
            <ActionBtn onClick={()=>setModal(null)} style={{background:'#0f172a'}}>Done</ActionBtn>
          </ModalCard>
        </ModalBG>
      )}
    </PageContainer>
  );
}
