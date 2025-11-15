import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { cashierAxios } from '../../utils/apiAdapters';
import { useNavigate, Link } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

// --- STYLES ---
const PageContainer = styled.div` display: flex; flex-direction: column; min-height: 100vh; background-color: #f9fafb; `;
const Header = styled.header` background-color: white; padding: 16px 32px; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); display: flex; justify-content: space-between; align-items: center; `;
const HeaderContent = styled.div` display: flex; align-items: center; gap: 20px; `;
const LogoText = styled.div` font-size: 1.5rem; font-weight: 700; color: #111827; `;
const LogoutButton = styled.button` background-color: #f3f4f6; color: #374151; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; &:hover { background-color: #fee2e2; color: #b91c1c; } `;
const MainContent = styled.main` display: flex; flex-direction: column; align-items: center; padding: 32px; gap: 24px; width: 100%; `;
const LogContainer = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05); width: 100%; max-width: 1000px; `;
const SectionTitle = styled.h2` font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; `;
const BackLink = styled(Link)` font-weight: 600; color: #7c3aed; text-decoration: none; &:hover { text-decoration: underline; } `;
const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 100%; max-width: 1000px; @media (max-width: 768px) { grid-template-columns: 1fr; } `;
const StatCard = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); `;
const StatValue = styled.p` font-size: 2.25rem; font-weight: 700; color: #111827; margin: 0 0 8px 0; &.positive { color: #16a34a; } &.negative { color: #dc2626; } &.net { color: #7c3aed; } `;
const StatLabel = styled.p` font-size: 0.875rem; font-weight: 500; color: #6b7280; margin: 0; `;
const TransactionList = styled.ul` list-style: none; padding: 0; margin: 0; `;

// --- STYLES FOR "MY LOG" ---
const TransactionItem = styled.li` display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; &:last-child { border-bottom: none; } `;
const TransactionDetails = styled.div` display: flex; flex-direction: column; `;
const TransactionType = styled.span` font-weight: 600; font-size: 1rem; color: #111827; text-transform: capitalize; `;
const TransactionDate = styled.span` font-size: 0.875rem; color: #6b7280; `;
const TransactionPhone = styled.span` font-weight: 500; color: #374151; `;
const TransactionAmount = styled.span` font-size: 1.125rem; font-weight: 700; text-align: right; color: ${props => props.type === 'TOPUP' ? '#16a34a' : '#dc2626'}; `;

// --- NEW STYLES FOR TABS AND "MEMBER LOG" ---
const TabContainer = styled.div` display: flex; gap: 8px; margin-bottom: -1px; margin-left: 20px; `;
const TabButton = styled.button`
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-bottom: none;
  background-color: ${p => p.active ? 'white' : 'transparent'};
  color: ${p => p.active ? '#4f46e5' : '#6b7280'};
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  ${p => p.active && `
    border-color: #e5e7eb;
    position: relative;
    z-index: 10;
  `}
  &:hover { color: #4f46e5; }
`;
const MemberLogItem = styled.li`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px 8px;
  border-bottom: 1px solid #e5e7eb;
  &:last-child { border-bottom: none; }
`;
const MemberName = styled.span` font-weight: 600; color: #111827; `;
const MemberDetail = styled.span` font-size: 0.875rem; color: #6b7280; `;
const RefundAmount = styled(TransactionAmount)` color: #dc2626; `;
const ViewButton = styled.button`
  background: #f1f5f9; color: #334155; border: none; padding: 8px 16px; border-radius: 8px;
  font-weight: 600; cursor: pointer; &:hover { background: #e2e8f0; }
`;

// --- NEW MODAL STYLES ---
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const ModalBackdrop = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; animation: ${fadeIn} 0.2s ease-out;
`;
const ModalContent = styled.div`
  background-color: white; padding: 24px; border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%; max-width: 600px;
  max-height: 80vh; overflow-y: auto;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;
`;
const ModalTitle = styled.h2` font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0; `;
const CloseButton = styled.button`
  background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px;
  font-size: 1.2rem; cursor: pointer; &:hover { background: #e2e8f0; }
`;
const ModalLogItem = styled.li`
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-bottom: 1px solid #f1f5f9;
`;
const ModalLogDetails = styled.div` display: flex; flex-direction: column; `;
const ModalLogTitle = styled.span` font-size: 1rem; font-weight: 600; color: #1e293b; text-transform: capitalize; `;
const ModalLogSubtitle = styled.span` font-size: 0.875rem; color: #64748b; `;
const ModalLogAmount = styled.span`
  font-size: 1.1rem; font-weight: 700;
  color: ${props => props.type === 'in' ? '#16a34a' : '#dc2626'};
`;


export default function CashierLogPage() {
  const { token, logout, cashier } = useCashierAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  // State for Tab 1
  const [data, setData] = useState({ summary: null, logs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Tab 2
  const [activeTab, setActiveTab] = useState('myLog');
  const [memberLogs, setMemberLogs] = useState([]);
  const [memberLoading, setMemberLoading] = useState(true);

  // State for Modal
  const [modalData, setModalData] = useState(null); // { wallet, logs }
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch data for Tab 1 (My Log)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await cashierAxios.get('/cashier/log');
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch transaction log.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Fetch data for Tab 2 (Member Log) when tab is clicked
  useEffect(() => {
    if (activeTab === 'memberLog' && memberLogs.length === 0) {
      const fetchMemberLogs = async () => {
        try {
          setMemberLoading(true);
          const res = await cashierAxios.get('/cashier/member-logs');
          setMemberLogs(res.data);
        } catch (err) {
          setError('Failed to fetch member logs.');
        } finally {
          setMemberLoading(false);
        }
      };
      fetchMemberLogs();
    }
  }, [activeTab, memberLogs.length]);

  // Fetch data for the modal
  const handleViewMemberHistory = async (wallet) => {
    setModalLoading(true);
    setModalData({ wallet, logs: [] }); // Set wallet info immediately to show title
    try {
      const res = await cashierAxios.get(`/cashier/member-log/${wallet.wallet_id}`);
      setModalData(res.data); // Set full data with logs
    } catch (err) {
      alert('Failed to load member history.');
      setModalData(null); // Close modal on error
    } finally {
      setModalLoading(false);
    }
  };

  // Helper functions
  const handleLogout = () => { logout(); navigate('/'); };
  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (val) => `₹${parseFloat(val || 0).toFixed(2)}`;
  const netCash = (data.summary?.total_topups || 0) - (data.summary?.total_refunds || 0);

  // Helper for modal transaction list
  const getLogTitle = (log) => {
    if (log.type === 'PURCHASE') return `Paid ${log.stall_name}`;
    if (log.type === 'TOPUP') return 'Wallet Top-up';
    if (log.type === 'REFUND') return 'Wallet Refund';
    return log.type.toLowerCase();
  };
  const getLogAmount = (log) => {
    const amount = parseFloat(log.amount);
    return `${log.type === 'TOPUP' ? '+' : '-'}${amount.toFixed(0)}`;
  };

  return (
    <>
      <PageContainer>
        <Header>
          <HeaderContent>
            <LogoText>Cashier Portal</LogoText>
            <BackLink to="/cashier/dashboard">&larr; Back to Dashboard</BackLink>
          </HeaderContent>
          <LogoutButton onClick={handleLogout}>Logout (Cashier: {cashier ? cashier.name : '...'})</LogoutButton>
        </Header>
        <MainContent>
          {loading ? <p>Loading summary...</p> : data.summary && (
            <StatsGrid>
              <StatCard><StatValue className="positive">{formatCurrency(data.summary.total_topups)}</StatValue><StatLabel>My Total Top-ups</StatLabel></StatCard>
              <StatCard><StatValue className="negative">-{formatCurrency(data.summary.total_refunds)}</StatValue><StatLabel>My Total Refunds</StatLabel></StatCard>
              <StatCard><StatValue className="net">{formatCurrency(netCash)}</StatValue><StatLabel>My Net Cash Collected</StatLabel></StatCard>
            </StatsGrid>
          )}

          <TabContainer>
            <TabButton active={activeTab === 'myLog'} onClick={() => setActiveTab('myLog')}>My Log</TabButton>
            <TabButton active={activeTab === 'memberLog'} onClick={() => setActiveTab('memberLog')}>Member Refund Log</TabButton>
          </TabContainer>

          {activeTab === 'myLog' && (
            <LogContainer>
              <SectionTitle>My Transaction Log (Last 50)</SectionTitle>
              {loading && <p>Loading log...</p>}
              {error && <p style={{color: 'red'}}>{error}</p>}
              <TransactionList>
                {data.logs.map(log => (
                  <TransactionItem key={log.cash_ledger_id}>
                    <TransactionDetails>
                      <TransactionType>{log.transaction_type.toLowerCase()}</TransactionType>
                      <TransactionDate>{formatDateTime(log.created_at)}</TransactionDate>
                    </TransactionDetails>
                    <TransactionPhone>Visitor: {log.visitor_phone}</TransactionPhone>
                    <TransactionAmount type={log.transaction_type}>{log.transaction_type === 'TOPUP' ? '+' : '-'}₹{parseFloat(log.amount).toFixed(2)}</TransactionAmount>
                  </TransactionItem>
                ))}
                {data.logs.length === 0 && !loading && <p>No transactions found.</p>}
              </TransactionList>
            </LogContainer>
          )}

          {activeTab === 'memberLog' && (
            <LogContainer>
              <SectionTitle>Club Member Refunds</SectionTitle>
              <p style={{color: '#6b7280', marginTop: -16, fontSize: '0.875rem'}}>Tracks all refunded member wallets for post-event settlement.</p>
              {memberLoading && <p>Loading member logs...</p>}
              <TransactionList>
                {/* Header Row */}
                <MemberLogItem as="div" style={{borderBottom: '2px solid #111827', fontWeight: 600, fontSize: '0.875rem'}}>
                  <MemberDetail>Member Name / Phone</MemberDetail>
                  <MemberDetail>Membership ID</MemberDetail>
                  <MemberDetail style={{textAlign: 'right'}}>Refunded Amount</MemberDetail>
                  <MemberDetail style={{textAlign: 'right'}}>Actions</MemberDetail>
                </MemberLogItem>
                
                {memberLogs.map(log => (
                  <MemberLogItem key={log.wallet_id}>
                    <div>
                      <MemberName>{log.visitor_name || 'N/A'}</MemberName>
                      <MemberDetail style={{display: 'block'}}>{log.visitor_phone}</MemberDetail>
                    </div>
                    <MemberDetail>{log.membership_id}</MemberDetail>
                    <RefundAmount type="REFUND" style={{textAlign: 'right'}}>-{formatCurrency(log.refunded_amount)}</RefundAmount>
                    <div style={{textAlign: 'right'}}>
                      <ViewButton onClick={() => handleViewMemberHistory(log)}>View History</ViewButton>
                    </div>
                  </MemberLogItem>
                ))}
                {memberLogs.length === 0 && !memberLoading && <p style={{padding: 16, textAlign: 'center'}}>No member refunds processed yet.</p>}
              </TransactionList>
            </LogContainer>
          )}

        </MainContent>
      </PageContainer>

      {/* --- MEMBER HISTORY MODAL --- */}
      {modalData && (
        <ModalBackdrop onClick={() => setModalData(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>History for {modalData.wallet.visitor_name || modalData.wallet.membership_id}</ModalTitle>
              <CloseButton onClick={() => setModalData(null)}>×</CloseButton>
            </ModalHeader>
            {modalLoading ? <p>Loading transactions...</p> : (
              <TransactionList>
                {modalData.logs.length === 0 && <p>No transactions found.</p>}
                {modalData.logs.map(log => (
                  <ModalLogItem key={log.id}>
                    <ModalLogDetails>
                      <ModalLogTitle>{getLogTitle(log)}</ModalLogTitle>
                      <ModalLogSubtitle>{formatDateTime(log.created_at)}</ModalLogSubtitle>
                    </ModalLogDetails>
                    <ModalLogAmount type={log.type === 'TOPUP' ? 'in' : 'out'}>
                      ₹{getLogAmount(log)}
                    </ModalLogAmount>
                  </ModalLogItem>
                ))}
              </TransactionList>
            )}
          </ModalContent>
        </ModalBackdrop>
      )}
    </>
  );
}