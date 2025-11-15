import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { visitorAxios } from '../../utils/apiAdapters';
import { useVisitorAuth } from '../../context/VisitorAuthContext';

// --- STYLED COMPONENTS (Unchanged) ---
const PageContainer = styled.div`
  padding: 20px;
`;
const WalletInfoCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
`;
const WelcomeHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
`;
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;
const DetailItem = styled.div`
  font-size: 0.9rem;
  color: #475569;
  & strong {
    color: #0f172a;
    display: block;
    font-size: 1rem;
  }
`;
const HistorySection = styled.div`
  margin-top: 24px;
`;
const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 8px;
  margin-bottom: 8px;
`;
const LogList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;
const LogItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 8px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child {
    border-bottom: none;
  }
`;
const LogDetails = styled.div`
  display: flex;
  flex-direction: column;
`;
const LogTitle = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  text-transform: capitalize;
`;
const LogSubtitle = styled.span`
  font-size: 0.875rem;
  color: #64748b;
`;
const LogAmount = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.type === 'in' ? '#16a34a' : '#dc2626'};
`;
const LoadingText = styled.p`
  text-align: center;
  color: #64748b;
  padding: 20px;
  font-size: 1rem;
`;
// --- End of Styles ---


export default function VisitorWalletPage() {
  // --- FIX: Get 'loading' from auth context as well ---
  const { wallet, visitor, loading: authLoading } = useVisitorAuth(); 
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true); // Renamed component loading state
  const [error, setError] = useState(null);

  useEffect(() => {
    // --- FIX: Don't fetch logs until auth is ready ---
    if (authLoading) {
      return; // Wait for the auth context to finish loading
    }
    
    // Auth is ready, now we can fetch logs
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        const res = await visitorAxios.get('/visitor/log');
        setLogs(res.data);
      } catch (err) {
        setError('Failed to load transaction history.');
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, [authLoading]); // Re-run this effect when authLoading changes

  const formatDateTime = (iso) => {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogTitle = (log) => {
    if (log.type === 'PURCHASE') return `Paid ${log.stall_name}`;
    if (log.type === 'TOPUP') return 'Wallet Top-up';
    if (log.type === 'REFUND') return 'Wallet Refund';
    return log.type.toLowerCase();
  };

  const getLogAmount = (log) => {
    const amount = parseFloat(log.amount);
    if (log.type === 'PURCHASE') return `-${amount.toFixed(0)}`;
    if (log.type === 'TOPUP') return `+${amount.toFixed(0)}`;
    if (log.type === 'REFUND') return `-${amount.toFixed(0)}`;
    return `${amount.toFixed(0)}`;
  };
  
  const getAmountType = (log) => {
     if (log.type === 'TOPUP') return 'in';
     return 'out'; // PURCHASE and REFUND are both money-out
  };

  // --- FIX: Add a top-level guard ---
  // This ensures we don't render *anything* until the context is loaded
  // This check is redundant with the one in VisitorLayout, but makes
  // this component independently safe and fixes the race condition.
  if (authLoading || !wallet || !visitor) {
    return <LoadingText>Loading Wallet...</LoadingText>;
  }

  // --- Render (now safe) ---
  return (
    <PageContainer>
      <WalletInfoCard>
        <WelcomeHeader>
          {/* We can now safely access visitor and wallet */}
          Hi, <strong>{wallet.visitor_name || visitor.phone}</strong>!
        </WelcomeHeader>
        <DetailGrid>
          <DetailItem>
            Phone
            <strong>{wallet.visitor_phone}</strong>
          </DetailItem>
          {wallet.membership_id && (
             <DetailItem>
              Member ID
              <strong>{wallet.membership_id}</strong>
            </DetailItem>
          )}
        </DetailGrid>
      </WalletInfoCard>

      <HistorySection>
        <SectionTitle>Transaction History</SectionTitle>
        <LogList>
          {logsLoading && <LoadingText>Loading history...</LoadingText>}
          {error && <LoadingText style={{color: '#dc2626'}}>{error}</LoadingText>}
          {!logsLoading && logs.length === 0 && (
            <LoadingText>No transactions yet.</LoadingText>
          )}
          
          {logs.map(log => (
            <LogItem key={log.id}>
              <LogDetails>
                <LogTitle>{getLogTitle(log)}</LogTitle>
                <LogSubtitle>{formatDateTime(log.created_at)}</LogSubtitle>
              </LogDetails>
              <LogAmount type={getAmountType(log)}>
                ₹{getLogAmount(log)}
              </LogAmount>
            </LogItem>
          ))}

        </LogList>
      </HistorySection>
    </PageContainer>
  );
}
