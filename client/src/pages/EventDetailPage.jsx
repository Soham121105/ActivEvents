import { useState, useEffect } from 'react'; // 1. Remove useRef
import styled from 'styled-components';
import { adminAxios } from '../utils/apiAdapters';
import { useParams, Link } from 'react-router-dom';

// ... (All styled components remain the same) ...
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
// --- END STYLES ---

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val || 0);
};

export default function EventDetailPage() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [financials, setFinancials] = useState(null); 
  const [cashiers, setCashiers] = useState([]);
  const [stalls, setStalls] = useState([]); 
  const [memberLogs, setMemberLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 2. This is the new, safe data-fetching function
  const fetchEventData = async () => {
    setLoading(true); 
    setError(null); 

    try {
      // 3. Fetch all CRITICAL data in parallel
      const [eventRes, finRes] = await Promise.all([
        adminAxios.get(`/events/${eventId}`),
        adminAxios.get(`/events/${eventId}/financial-summary`)
      ]);

      setEvent(eventRes.data);
      setFinancials(finRes.data);
      
      // 4. Fetch non-critical data
      try {
        const stallsRes = await adminAxios.get(`/events/${eventId}/stalls`);
        setStalls(stallsRes.data);
      } catch (err) {
        console.warn("Could not load stalls:", err);
      }
      
      try {
        const cashiersRes = await adminAxios.get(`/events/${eventId}/cashiers`);
        setCashiers(cashiersRes.data);
      } catch (err) {
        console.warn("Could not load cashiers:", err);
      }

      try {
        const memberLogsRes = await adminAxios.get(`/events/${eventId}/member-refund-logs`);
        setMemberLogs(memberLogsRes.data);
      } catch (err) {
        console.warn("Could not load member logs:", err);
      }

    } catch (err) {
      // 5. If any *critical* fetch fails, set the main error state
      // This will now only be hit for network errors, not auth errors
      console.error("Error fetching critical dashboard data:", err);
      setError("Failed to load event dashboard. Please refresh the page.");
    } finally {
      // 6. Set loading to FALSE *after* all fetches are done.
      setLoading(false);
    }
  };

  // 7. This simple useEffect is now correct
  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const handleDeleteCashier = async (cashierId) => {
    if (!window.confirm("Are you sure you want to delete this cashier?")) return;
    try {
      await adminAxios.delete(`/events/${eventId}/cashiers/${cashierId}`);
      setCashiers(prev => prev.filter(c => c.cashier_id !== cashierId));
    } catch (err) {
      alert("Failed to delete cashier.");
    }
  };

  const handleDeleteStall = async (stallId) => {
    if (!window.confirm("ARE YOU SURE?\n\nThis will delete this stall. This action cannot be undone.")) return;
    try {
      await adminAxios.delete(`/events/${eventId}/stalls/${stallId}`);
      setStalls(prev => prev.filter(s => s.stall_id !== stallId));
      // Refresh financials as they are now out of date
      const finRes = await adminAxios.get(`/events/${eventId}/financial-summary`);
      setFinancials(finRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete stall.");
    }
  };

  // --- RENDER GUARDS ---
  if (loading) return <p style={{padding: 32}}>Loading dashboard...</p>;
  
  if (error) return <p style={{color: 'red', padding: 32}}>{error}</p>;
  
  // This guard is still important for the *initial* load
  if (!event || !financials) {
    return <p style={{color: 'red', padding: 32}}>Failed to load essential event data. Please refresh.</p>;
  }

  // --- CRASH FIX: Apply defaults ---
  const cash = financials.cash || { total_in: 0, total_out: 0 };
  const sales = financials.sales || { total_sales: 0, total_commission: 0, total_owed: 0 };
  const financialStalls = financials.stalls || [];
  // --- END CRASH FIX ---

  const netCash = parseFloat(cash.total_in) - parseFloat(cash.total_out);

  return (
    <DashboardContainer>
      {/* --- HEADER --- */}
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

      {/* --- TABBED CONTENT --- */}
      <TabContainer>
        <TabHeader>
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Financial Overview</TabButton>
          <TabButton active={activeTab === 'stalls'} onClick={() => setActiveTab('stalls')}>Stall Management</TabButton>
          <TabButton active={activeTab === 'cashiers'} onClick={() => setActiveTab('cashiers')}>Cashier Staff</TabButton>
          <TabButton active={activeTab === 'memberLogs'} onClick={() => setActiveTab('memberLogs')}>Member Refund Logs</TabButton>
        </TabHeader>

        {/* --- TAB 1: FINANCIAL OVERVIEW (Using safe variables) --- */}
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

        {/* --- TAB 2: STALL MANAGEMENT (Uses `stalls` state) --- */}
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

        {/* --- TAB 3: CASHIER STAFF (Uses `cashiers` state) --- */}
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

        {/* --- TAB 4: MEMBER REFUND LOGS (Uses `memberLogs` state) --- */}
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
                  </tr>
                </thead>
                <tbody>
                  {memberLogs.length === 0 ? (
                    <tr><Td colSpan="5"><EmptyState>No member refunds have been processed yet.</EmptyState></Td></tr>
                  ) : (
                    memberLogs.map(log => (
                      <Tr key={log.wallet_id}>
                        <Td style={{fontWeight: 600}}>{log.visitor_name || 'N/A'}</Td>
                        <Td className="mono">{log.membership_id}</Td>
                        <Td className="mono">{log.visitor_phone}</Td>
                        <Td>{new Date(log.refund_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Td>
                        <Td className="right mono" style={{color: '#dc2626', fontWeight: 600}}>{formatCurrency(log.refunded_amount)}</Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>
          </TabContent>
        )}

      </TabContainer>
    </DashboardContainer>
  );
}
