import { useState, useEffect } from 'react';
import styled from 'styled-components';
// --- CHANGE: Use cashier adapter ---
import { cashierAxios } from '../../utils/apiAdapters';
import { useNavigate, Link } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

// ... (Keep all styled components exactly the same) ...
// (Omitting for brevity)
const PageContainer = styled.div` display: flex; flex-direction: column; min-height: 100vh; background-color: #f9fafb; `;
const Header = styled.header` background-color: white; padding: 16px 32px; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); display: flex; justify-content: space-between; align-items: center; `;
const HeaderContent = styled.div` display: flex; align-items: center; gap: 20px; `;
const LogoText = styled.div` font-size: 1.5rem; font-weight: 700; color: #111827; `;
const LogoutButton = styled.button` background-color: #f3f4f6; color: #374151; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; &:hover { background-color: #fee2e2; color: #b91c1c; } `;
const MainContent = styled.main` display: flex; flex-direction: column; align-items: center; padding: 32px; gap: 24px; `;
const LogContainer = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05); width: 100%; max-width: 800px; `;
const SectionTitle = styled.h2` font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; `;
const BackLink = styled(Link)` font-weight: 600; color: #7c3aed; text-decoration: none; &:hover { text-decoration: underline; } `;
const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 100%; max-width: 800px; @media (max-width: 768px) { grid-template-columns: 1fr; } `;
const StatCard = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); `;
const StatValue = styled.p` font-size: 2.25rem; font-weight: 700; color: #111827; margin: 0 0 8px 0; &.positive { color: #16a34a; } &.negative { color: #dc2626; } &.net { color: #7c3aed; } `;
const StatLabel = styled.p` font-size: 0.875rem; font-weight: 500; color: #6b7280; margin: 0; `;
const TransactionList = styled.ul` list-style: none; padding: 0; margin: 0; `;
const TransactionItem = styled.li` display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; &:last-child { border-bottom: none; } `;
const TransactionDetails = styled.div` display: flex; flex-direction: column; `;
const TransactionType = styled.span` font-weight: 600; font-size: 1rem; color: #111827; text-transform: capitalize; `;
const TransactionDate = styled.span` font-size: 0.875rem; color: #6b7280; `;
const TransactionPhone = styled.span` font-weight: 500; color: #374151; `;
const TransactionAmount = styled.span` font-size: 1.125rem; font-weight: 700; text-align: right; color: ${props => props.type === 'TOPUP' ? '#16a34a' : '#dc2626'}; `;

export default function CashierLogPage() {
  // Same simple auth check, rely on navigate('/') fallback if token is missing.
  const { token, logout, cashier } = useCashierAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  const [data, setData] = useState({ summary: null, logs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // --- CHANGE: Use cashierAxios ---
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

  const handleLogout = () => { logout(); navigate('/'); };
  const formatDateTime = (isoString) => { const date = new Date(isoString); return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`; };
  const formatCurrency = (val) => `₹${parseFloat(val || 0).toFixed(2)}`;
  const netCash = (data.summary?.total_topups || 0) - (data.summary?.total_refunds || 0);

  return (
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
            <StatCard><StatValue className="positive">{formatCurrency(data.summary.total_topups)}</StatValue><StatLabel>Total Top-ups</StatLabel></StatCard>
            <StatCard><StatValue className="negative">-{formatCurrency(data.summary.total_refunds)}</StatValue><StatLabel>Total Refunds</StatLabel></StatCard>
            <StatCard><StatValue className="net">{formatCurrency(netCash)}</StatValue><StatLabel>Net Cash Collected</StatLabel></StatCard>
          </StatsGrid>
        )}
        <LogContainer>
          <SectionTitle>My Transaction Log</SectionTitle>
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
      </MainContent>
    </PageContainer>
  );
}
