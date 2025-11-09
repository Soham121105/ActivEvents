
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAxios } from '../utils/apiAdapters';
import { useParams, Link } from 'react-router-dom';

// --- STYLED COMPONENTS ---
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  @media (max-width: 640px) {
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
  gap: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
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
  }
`;

// --- STATS CARDS ---
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

// --- DATA TABLES ---
const TableSection = styled.section`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
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
  font-size: 1rem;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
  
  &.mono { font-family: monospace; font-weight: 600; }
  &.right { text-align: right; }
`;

const Tr = styled.tr`
  &:hover { background-color: #f9fafb; }
`;

const StatusBadge = styled.span`
  background-color: ${props => props.active ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.active ? '#166534' : '#991b1b'};
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
`;

// --- ACTION BUTTONS IN TABLE ---
const TableActionButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  margin-left: 16px;
  &:hover { color: #ef4444; text-decoration: underline; }
`;

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      // Parallel data fetching for speed
      const [eventRes, finRes, cashiersRes] = await Promise.all([
        adminAxios.get(`/events/${id}`),
        adminAxios.get(`/events/${id}/financial-summary`),
        adminAxios.get(`/events/${id}/cashiers`)
      ]);

      setEvent(eventRes.data);
      setFinancials(finRes.data);
      setCashiers(cashiersRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load event dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const handleDeleteCashier = async (cashierId) => {
    if (!window.confirm("Are you sure you want to delete this cashier?")) return;
    try {
      await adminAxios.delete(`/events/${id}/cashiers/${cashierId}`);
      setCashiers(prev => prev.filter(c => c.cashier_id !== cashierId));
    } catch (err) {
      alert("Failed to delete cashier.");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) return <p style={{padding: 32}}>Loading dashboard...</p>;
  if (error || !event || !financials) return <p style={{color: 'red', padding: 32}}>{error || 'Failed to load data.'}</p>;

  const netCash = parseFloat(financials.cash.total_in) - parseFloat(financials.cash.total_out);

  return (
    <DashboardContainer>
      {/* --- HEADER --- */}
      <HeaderSection>
        <div>
          <Link to="/" style={{color: '#6b7280', textDecoration: 'none', fontWeight: 500}}>
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
          <Button to={`/event/${id}/add-stall`} secondary>+ Add Stall</Button>
          <Button to={`/event/${id}/add-cashier`}>+ Add Cashier</Button>
        </ActionButtons>
      </HeaderSection>

      {/* --- FINANCIAL OVERVIEW CARDS --- */}
      <StatsGrid>
        <StatCard>
          <StatLabel>Net Cash Collected</StatLabel>
          <StatValue className="green">{formatCurrency(netCash)}</StatValue>
          <StatSub>In: {formatCurrency(financials.cash.total_in)} | Out: {formatCurrency(financials.cash.total_out)}</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Total Stall Sales</StatLabel>
          <StatValue className="blue">{formatCurrency(financials.sales.total_sales)}</StatValue>
          <StatSub>Gross transaction value</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Your Revenue (Commission)</StatLabel>
          <StatValue className="indigo">{formatCurrency(financials.sales.total_commission)}</StatValue>
          <StatSub>Net profit for organizer</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Total Owed to Stalls</StatLabel>
          <StatValue>{formatCurrency(financials.sales.total_owed)}</StatValue>
          <StatSub>Payable after event</StatSub>
        </StatCard>
      </StatsGrid>

      {/* --- STALL PERFORMANCE TABLE --- */}
      <TableSection>
        <SectionHeader>
          <SectionTitle>Stall Performance & Payouts</SectionTitle>
        </SectionHeader>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Stall Name</Th>
                <Th className="right">Total Sales</Th>
                <Th className="right">Commission</Th>
                <Th className="right">Net Payable</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {financials.stalls.length === 0 ? (
                <tr><Td colSpan="5" style={{textAlign: 'center', color: '#9ca3af'}}>No stalls yet.</Td></tr>
              ) : (
                financials.stalls.map(stall => (
                  <Tr key={stall.stall_id}>
                    <Td style={{fontWeight: 600}}>{stall.stall_name}</Td>
                    <Td className="right mono">{formatCurrency(stall.stall_sales)}</Td>
                    <Td className="right mono" style={{color: '#ef4444'}}>-{formatCurrency(stall.stall_commission)}</Td>
                    <Td className="right mono" style={{color: '#059669'}}>{formatCurrency(stall.stall_revenue)}</Td>
                    <Td className="right">
                      <Link to={`/event/${id}/stall/${stall.stall_id}/finance`} style={{color: '#4f46e5', fontWeight: 600, textDecoration: 'none'}}>
                        View Details &rarr;
                      </Link>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableSection>

      {/* --- CASHIER STAFF TABLE --- */}
      <TableSection>
        <SectionHeader>
          <SectionTitle>Cashier Staff</SectionTitle>
        </SectionHeader>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Cashier Name</Th>
                <Th>Status</Th>
                <Th className="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {cashiers.length === 0 ? (
                <tr><Td colSpan="3" style={{textAlign: 'center', color: '#9ca3af'}}>No cashiers yet.</Td></tr>
              ) : (
                 cashiers.map(c => (
                   <Tr key={c.cashier_id}>
                     <Td style={{fontWeight: 600}}>{c.cashier_name}</Td>
                     <Td><StatusBadge active={c.is_active}>{c.is_active ? 'Active' : 'Inactive'}</StatusBadge></Td>
                     <Td className="right">
                       <TableActionButton onClick={() => handleDeleteCashier(c.cashier_id)}>
                         Delete
                       </TableActionButton>
                     </Td>
                   </Tr>
                 ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableSection>
    </DashboardContainer>
  );
}
