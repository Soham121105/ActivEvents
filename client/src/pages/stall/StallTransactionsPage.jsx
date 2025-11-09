import { useState, useEffect } from 'react';
import styled from 'styled-components';
// --- CHANGE: Use stall adapter ---
import { stallAxios } from '../../utils/apiAdapters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ... (Keep all styled components exactly the same) ...
const PageHeader = styled.h1` font-size: 2.25rem; font-weight: 800; color: #111827; margin-top: 0; margin-bottom: 24px; `;
const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 24px; @media (max-width: 768px) { grid-template-columns: 1fr; } `;
const StatCard = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); `;
const StatLabel = styled.p` font-size: 0.875rem; font-weight: 500; color: #6b7280; margin: 0; `;
const StatValue = styled.p` font-size: 2.25rem; font-weight: 700; color: #111827; margin: 8px 0; `;
const HeroStatCard = styled(StatCard)` background-color: #7c3aed; color: white; ${StatLabel} { color: #e9d5ff; } ${StatValue} { color: white; } `;
const Section = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); `;
const SectionTitle = styled.h2` font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; `;
const LogList = styled.ul` list-style: none; padding: 0; margin: 0; `;
const LogItem = styled.li` display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb; &:last-child { border-bottom: none; } `;
const LogDetail = styled.div` display: flex; flex-direction: column; `;
const LogPhone = styled.span` font-weight: 600; font-size: 1rem; color: #111827; `;
const LogDate = styled.span` font-size: 0.875rem; color: #6b7280; `;
const LogAmount = styled.span` font-weight: 600; font-size: 1rem; text-align: right; color: ${props => props.color || '#111827'}; `;

export default function StallTransactionsPage() {
  const [data, setData] = useState({ summary: null, logs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- CHANGE: Use stallAxios ---
        const res = await stallAxios.get('/stalls/transactions');
        setData(res.data);
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError('Failed to fetch transactions.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toFixed(2)}`;
  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-IN');

  if (loading) return <PageHeader>Loading transactions...</PageHeader>;
  if (error) return <p style={{color: 'red', fontSize: '1.25rem'}}>{error}</p>;

  return (
    <div>
      <PageHeader>Your Transactions</PageHeader>
      <StatsGrid>
        <HeroStatCard>
          <StatLabel>Your Total Earnings (Net)</StatLabel>
          <StatValue>{formatCurrency(data.summary?.your_earnings)}</StatValue>
        </HeroStatCard>
        <StatCard>
          <StatLabel>Total Sales (Gross)</StatLabel>
          <StatValue>{formatCurrency(data.summary?.total_sales)}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Total Commission Paid</StatLabel>
          <StatValue>{formatCurrency(data.summary?.total_sales - data.summary?.your_earnings)}</StatValue>
        </StatCard>
      </StatsGrid>
      <Section>
        <SectionTitle>Sales Log</SectionTitle>
        <div style={{ width: '100%', height: 300, marginBottom: '24px' }}>
          <ResponsiveContainer>
            <BarChart data={data.logs.slice().reverse()} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="created_at" tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})} />
              <YAxis tickFormatter={(val) => `₹${val}`} />
              <Tooltip formatter={(value, name) => [formatCurrency(value), name.replace(/_/g, ' ')]} />
              <Bar dataKey="total_amount" fill="#8884d8" name="Total Sale" />
              <Bar dataKey="stall_share" fill="#82ca9d" name="Your Share" />
              <Bar dataKey="organizer_share" fill="#ffc658" name="Event Cut" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <LogItem as="div" style={{borderBottom: '2px solid #111827', fontWeight: 600}}>
          <LogDetail>Customer</LogDetail>
          <LogAmount>Total Sale</LogAmount>
          <LogAmount color="#ef4444">Event Cut</LogAmount>
          <LogAmount color="#16a34a">Your Share</LogAmount>
        </LogItem>
        <LogList>
          {data.logs.length === 0 && <p>No transactions found yet.</p>}
          {data.logs.map(log => (
            <LogItem key={log.transaction_id}>
              <LogDetail>
                <LogPhone>{log.visitor_name || log.visitor_phone || 'Walk-up'}</LogPhone>
                <LogDate>{formatDateTime(log.created_at)}</LogDate>
              </LogDetail>
              <LogAmount>{formatCurrency(log.total_amount)}</LogAmount>
              <LogAmount color="#ef4444">-{formatCurrency(log.organizer_share)}</LogAmount>
              <LogAmount color="#16a34a">+{formatCurrency(log.stall_share)}</LogAmount>
            </LogItem>
          ))}
        </LogList>
      </Section>
    </div>
  );
}
