import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { adminAxios } from '../utils/apiAdapters';
import { useParams, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext'; // NEW: To get club slug
import QRCode from 'react-qr-code'; // NEW: To generate QR

// -----------------------------
// Styled Components
// -----------------------------
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;
const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;
const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  line-height: 1.1;
`;
const EventMeta = styled.div`
  color: #6b7280;
  font-size: 1.1rem;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;
const StatusBadge = styled.span`
  background-color: ${props => props.active ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.active ? '#166534' : '#991b1b'};
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  @media (max-width: 768px) {
    width: 100%;
    & > a { flex: 1; text-align: center; }
  }
`;
const Button = styled(Link)`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  background-color: ${props => props.secondary ? 'white' : '#4f46e5'};
  color: ${props => props.secondary ? '#374151' : 'white'};
  border: 1px solid ${props => props.secondary ? '#d1d5db' : 'transparent'};
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;
const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
`;
const StatLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
const StatValue = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-top: 8px;
  
  &.green { color: #059669; }
  &.blue { color: #2563eb; }
  &.indigo { color: #4f46e5; }
`;
const StatSub = styled.span`
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 4px;
`;
const TabContainer = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;
const TabHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  background-color: #f9fafb;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
`;
const TabButton = styled.button`
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.active ? '#4f46e5' : '#6b7280'};
  border-bottom: 3px solid ${props => props.active ? '#4f46e5' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: #4f46e5;
  }
`;
const TabContent = styled.div`
  padding: 24px;
`;
const TableWrapper = styled.div`
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
`;
const Th = styled.th`
  text-align: left;
  padding: 16px 24px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;
const Td = styled.td`
  padding: 16px 24px;
  font-size: 0.95rem;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
  
  &.mono { font-family: monospace; font-weight: 600; }
  &.right { text-align: right; }
`;
const Tr = styled.tr`
  &:hover { background-color: #f9fafb; }
`;
const TableActionButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  margin-left: 16px;
  padding: 4px 8px;
  border-radius: 6px;

  &.view {
    color: #4f46e5;
    &:hover { background-color: #eef2ff; }
  }
  &.delete {
    color: #ef4444;
    &:hover { background-color: #fef2f2; }
  }
`;
const EmptyState = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 48px;
  font-size: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 16px;
`;

// Modal styles
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
const LogList = styled.ul` list-style: none; padding: 0; margin: 0; `;
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

// -----------------------------
// Helpers
// -----------------------------
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);
};

const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const getLogTitle = (log) => {
  if (!log) return '';
  if (log.type === 'PURCHASE') return `Paid ${log.stall_name || ''}`;
  if (log.type === 'TOPUP') return 'Wallet Top-up';
  if (log.type === 'REFUND') return 'Wallet Refund';
  return (log.type || '').toLowerCase();
};
const getLogAmount = (log) => {
  const amount = parseFloat(log.amount || log.refunded_amount || log.total_amount || 0);
  if (log.type === 'TOPUP') return `+${amount.toFixed(0)}`;
  return `-${amount.toFixed(0)}`;
};

// -----------------------------
// Component
// -----------------------------
export default function EventDetailPage() {
  const { id: eventId } = useParams();
  const { admin } = useAdminAuth(); // NEW: Access admin info for slug
  const [event, setEvent] = useState(null);
  const [financials, setFinancials] = useState(null); 
  const [cashiers, setCashiers] = useState([]);
  const [stalls, setStalls] = useState([]); 
  const [memberLogs, setMemberLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal state for member history
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch all data
  const fetchEventData = async () => {
    setLoading(true);
    setError(null);
    let isAuthError = false;

    try {
      const [eventRes, finRes] = await Promise.all([
        adminAxios.get(`/events/${eventId}`),
        adminAxios.get(`/events/${eventId}/financial-summary`)
      ]);

      setEvent(eventRes.data);
      setFinancials(finRes.data);

      try {
        const stallsRes = await adminAxios.get(`/events/${eventId}/stalls`);
        setStalls(stallsRes.data);
      } catch (err) { if (err.response?.status === 401) isAuthError = true; }

      try {
        const cashiersRes = await adminAxios.get(`/events/${eventId}/cashiers`);
        setCashiers(cashiersRes.data);
      } catch (err) { if (err.response?.status === 401) isAuthError = true; }

      try {
        const memberLogsRes = await adminAxios.get(`/events/${eventId}/member-refund-logs`);
        setMemberLogs(memberLogsRes.data);
      } catch (err) { if (err.response?.status === 401) isAuthError = true; }

    } catch (err) {
      if (err.response?.status === 401) {
        isAuthError = true;
      } else {
        console.error("Error fetching critical dashboard data:", err);
        setError("Failed to load event dashboard. Please refresh the page.");
      }
    } finally {
      if (!isAuthError) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleDeleteCashier = async (cashierId) => {
    if (!window.confirm("Are you sure you want to delete this cashier?")) return;
    try {
      await adminAxios.delete(`/events/${eventId}/cashiers/${cashierId}`);
      setCashiers(prev => prev.filter(c => c.cashier_id !== cashierId));
    } catch (err) {
      if (err.response?.status !== 401) alert("Failed to delete cashier.");
    }
  };

  const handleDeleteStall = async (stallId) => {
    if (!window.confirm("ARE YOU SURE?\n\nThis will delete this stall. This action cannot be undone.")) return;
    try {
      await adminAxios.delete(`/events/${eventId}/stalls/${stallId}`);
      setStalls(prev => prev.filter(s => s.stall_id !== stallId));
      const finRes = await adminAxios.get(`/events/${eventId}/financial-summary`);
      setFinancials(finRes.data);
    } catch (err) {
      if (err.response?.status !== 401) alert(err.response?.data?.error || "Failed to delete stall.");
    }
  };

  const handleViewMemberHistory = async (wallet) => {
    if (!wallet || !wallet.wallet_id) return;
    setModalLoading(true);
    setModalData({ wallet, logs: [] });
    try {
      const res = await adminAxios.get(`/events/${eventId}/member-log/${wallet.wallet_id}`);
      setModalData(res.data);
    } catch (err) {
      alert('Failed to load member history.');
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Generate Registration URL
  const regUrl = admin?.url_slug 
    ? `${window.location.origin}/${admin.url_slug}/v/register?event=${eventId}`
    : '';

  if (loading) return <p style={{padding: 32}}>Loading dashboard...</p>;
  if (error) return <p style={{color: 'red', padding: 32}}>{error}</p>;
  if (!event || !financials) return <p style={{color: 'red', padding: 32}}>Failed to load essential event data.</p>;

  const cash = financials.cash || { total_in: 0, total_out: 0 };
  const sales = financials.sales || { total_sales: 0, total_commission: 0, total_owed: 0 };
  const financialStalls = financials.stalls || [];
  const netCash = parseFloat(cash.total_in) - parseFloat(cash.total_out);

  return (
    <DashboardContainer>
      {/* Header */}
      <HeaderSection>
        <div>
          <Link to="/" style={{color: '#6b7280', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem'}}>
            &larr; Back to Events
          </Link>
          <PageTitle style={{marginTop: '16px'}}>{event.event_name}</PageTitle>
          <EventMeta>
            {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <StatusBadge active={event.status !== 'COMPLETED'}>
              {event.status}
            </StatusBadge>
          </EventMeta>
        </div>
        <ActionButtons>
          <Button to={`/event/${eventId}/add-stall`} secondary>+ Add Stall</Button>
          <Button to={`/event/${eventId}/add-cashier`}>+ Add Cashier</Button>
        </ActionButtons>
      </HeaderSection>

      {/* Tabs */}
      <TabContainer>
        <TabHeader>
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Financial Overview</TabButton>
          <TabButton active={activeTab === 'stalls'} onClick={() => setActiveTab('stalls')}>Stall Management</TabButton>
          <TabButton active={activeTab === 'cashiers'} onClick={() => setActiveTab('cashiers')}>Cashier Staff</TabButton>
          <TabButton active={activeTab === 'memberLogs'} onClick={() => setActiveTab('memberLogs')}>Member Refund Logs</TabButton>
          {/* NEW TAB */}
          <TabButton active={activeTab === 'registration'} onClick={() => setActiveTab('registration')}>Visitor Registration</TabButton>
        </TabHeader>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <TabContent>
            <StatsGrid>
              <StatCard>
                <StatLabel>Net Cash Collected</StatLabel>
                <StatValue className="green">{formatCurrency(netCash)}</StatValue>
                <StatSub>In: {formatCurrency(cash.total_in)} | Out: {formatCurrency(cash.total_out)}</StatSub>
              </StatCard>
              <StatCard>
                <StatLabel>Total Stall Sales</StatLabel>
                <StatValue className="blue">{formatCurrency(sales.total_sales)}</StatValue>
                <StatSub>Gross transaction value</StatSub>
              </StatCard>
              <StatCard>
                <StatLabel>Your Revenue (Commission)</StatLabel>
                <StatValue className="indigo">{formatCurrency(sales.total_commission)}</StatValue>
                <StatSub>Net profit for organizer</StatSub>
              </StatCard>
              <StatCard>
                <StatLabel>Total Owed to Stalls</StatLabel>
                <StatValue>{formatCurrency(sales.total_owed)}</StatValue>
                <StatSub>Payable after event</StatSub>
              </StatCard>
            </StatsGrid>

            <SectionTitle style={{fontSize: '1.25rem', marginTop: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px'}}>Stall Payouts Summary</SectionTitle>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Stall Name</Th>
                    <Th className="right">Total Sales</Th>
                    <Th className="right">Commission</Th>
                    <Th className="right">Net Payable</Th>
                    <Th className="right">Details</Th>
                  </tr>
                </thead>
                <tbody>
                  {financialStalls.length === 0 ? (
                    <tr><Td colSpan="5"><EmptyState>No stalls have any sales yet.</EmptyState></Td></tr>
                  ) : (
                    financialStalls.map(stall => (
                      <Tr key={stall.stall_id}>
                        <Td style={{fontWeight: 600}}>{stall.stall_name}</Td>
                        <Td className="right mono">{formatCurrency(stall.stall_sales)}</Td>
                        <Td className="right mono" style={{color: '#ef4444'}}>-{formatCurrency(stall.stall_commission)}</Td>
                        <Td className="right mono" style={{color: '#059669'}}>{formatCurrency(stall.stall_revenue)}</Td>
                        <Td className="right">
                          <TableActionButton as={Link} to={`/event/${eventId}/stall/${stall.stall_id}/finance`} className="view">
                            View Log
                          </TableActionButton>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </TabContent>
        )}

        {/* Stalls Tab */}
        {activeTab === 'stalls' && (
          <TabContent>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Stall Name</Th>
                    <Th>Login Phone</Th>
                    <Th>Commission</Th>
                    <Th className="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {stalls.length === 0 ? (
                    <tr><Td colSpan="4"><EmptyState>No stalls added yet. Click "+ Add Stall" to begin.</EmptyState></Td></tr>
                  ) : (
                    stalls.map(stall => (
                      <Tr key={stall.stall_id}>
                        <Td style={{fontWeight: 600}}>{stall.stall_name}</Td>
                        <Td className="mono">{stall.owner_phone}</Td>
                        <Td style={{fontWeight: 600, color: '#1f2937'}}>{(stall.commission_rate * 100).toFixed(0)}%</Td>
                        <Td className="right">
                          <TableActionButton as={Link} to={`/event/${eventId}/stall/${stall.stall_id}/finance`} className="view">
                            View Sales
                          </TableActionButton>
                          <TableActionButton className="delete" onClick={() => handleDeleteStall(stall.stall_id)}>
                            Delete
                          </TableActionButton>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </TabContent>
        )}

        {/* Cashiers Tab */}
        {activeTab === 'cashiers' && (
          <TabContent>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Cashier Name</Th>
                    <Th>Status</Th>
                    <Th>Created On</Th>
                    <Th className="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {cashiers.length === 0 ? (
                    <tr><Td colSpan="4"><EmptyState>No cashiers added yet. Click "+ Add Cashier" to begin.</EmptyState></Td></tr>
                  ) : (
                    cashiers.map(c => (
                      <Tr key={c.cashier_id}>
                        <Td style={{fontWeight: 600}}>{c.cashier_name}</Td>
                        <Td><StatusBadge active={c.is_active}>{c.is_active ? 'Active' : 'Inactive'}</StatusBadge></Td>
                        <Td>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                        <Td className="right">
                          <TableActionButton className="delete" onClick={() => handleDeleteCashier(c.cashier_id)}>
                            Delete
                          </TableActionButton>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </TabContent>
        )}

        {/* Member Logs Tab */}
        {activeTab === 'memberLogs' && (
          <TabContent>
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Member Name</Th>
                    <Th>Membership ID</Th>
                    <Th>Phone</Th>
                    <Th>Refund Date</Th>
                    <Th className="right">Amount Refunded</Th>
                    <Th className="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {memberLogs.length === 0 ? (
                    <tr><Td colSpan="6"><EmptyState>No member refunds have been processed yet.</EmptyState></Td></tr>
                  ) : (
                    memberLogs.map(log => (
                      <Tr key={log.wallet_id + '-' + (log.refund_date || '')}>
                        <Td style={{fontWeight: 600}}>{log.visitor_name || 'N/A'}</Td>
                        <Td className="mono">{log.membership_id}</Td>
                        <Td className="mono">{log.visitor_phone}</Td>
                        <Td>{formatDateTime(log.refund_date)}</Td>
                        <Td className="right mono" style={{color: '#dc2626', fontWeight: 600}}>{formatCurrency(log.refunded_amount)}</Td>
                        <Td className="right">
                          <TableActionButton className="view" onClick={() => handleViewMemberHistory(log)}>
                            View History
                          </TableActionButton>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </TabContent>
        )}

        {/* NEW: Visitor Registration Tab */}
        {activeTab === 'registration' && (
          <TabContent>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '48px 24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Visitor Registration QR Code</h3>
              <p style={{ color: '#6b7280', maxWidth: '500px', margin: 0 }}>
                Print this QR code or display it on a screen at the event entrance. 
                Visitors can scan it to create their wallet and add funds.
              </p>
              
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {regUrl && <QRCode value={regUrl} size={256} />}
              </div>

              <div style={{ background: '#f9fafb', padding: '12px 24px', borderRadius: '8px', border: '1px solid #e5e7eb', fontFamily: 'monospace', color: '#4b5563', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {regUrl}
              </div>
              
              <Button as="a" href={regUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                Open Registration Page
              </Button>
            </div>
          </TabContent>
        )}

      </TabContainer>

      {/* Member History Modal */}
      {modalData && (
        <ModalBackdrop onClick={() => setModalData(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                History for {modalData.wallet?.visitor_name || modalData.wallet?.membership_id || 'Member'}
              </ModalTitle>
              <CloseButton onClick={() => setModalData(null)}>×</CloseButton>
            </ModalHeader>

            {modalLoading ? <p>Loading transactions...</p> : (
              <div>
                {modalData.wallet && (
                  <div style={{marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontWeight: 700}}>{modalData.wallet.visitor_name || 'N/A'}</div>
                      <div style={{color: '#6b7280'}}>{modalData.wallet.visitor_phone || ''} {modalData.wallet.membership_id ? `• ${modalData.wallet.membership_id}` : ''}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      {modalData.wallet.balance !== undefined && <div style={{fontWeight: 700}}>{formatCurrency(modalData.wallet.balance)}</div>}
                      <div style={{color: '#9ca3af'}}>Wallet Balance</div>
                    </div>
                  </div>
                )}

                <LogList>
                  {(!modalData.logs || modalData.logs.length === 0) && <p>No transactions found.</p>}
                  {modalData.logs && modalData.logs.map(log => (
                    <ModalLogItem key={log.id || log.order_id || `${log.type}-${log.created_at}`}>
                      <ModalLogDetails>
                        <ModalLogTitle>{getLogTitle(log)}</ModalLogTitle>
                        <ModalLogSubtitle>{formatDateTime(log.created_at)}</ModalLogSubtitle>
                      </ModalLogDetails>
                      <ModalLogAmount type={log.type === 'TOPUP' ? 'in' : 'out'}>
                        ₹{getLogAmount(log)}
                      </ModalLogAmount>
                    </ModalLogItem>
                  ))}
                </LogList>
              </div>
            )}
          </ModalContent>
        </ModalBackdrop>
      )}

    </DashboardContainer>
  );
}