import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Link } from 'react-router-dom';

// ... (All styling is identical, just copy/paste) ...
const PageHeaderContainer = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
`;
const PageHeader = styled.h1`
  font-size: 2.25rem; font-weight: 800; color: #111827; margin-top: 0; margin-bottom: 0;
`;
const Button = styled(Link)`
  background-color: #2563eb; color: white; font-weight: 600; padding: 12px 24px;
  border-radius: 8px; border: none; cursor: pointer; font-size: 1rem;
  text-decoration: none; transition: background-color 0.2s;
  &:hover { background-color: #1d4ed8; }
`;
const LoadingText = styled.p`
  font-size: 1.125rem; color: #6b7280;
`;
const Section = styled.div`
  background-color: white; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
`;
const List = styled.ul`
  list-style: none; padding: 0; margin: 0;
`;
const ListItem = styled.li`
  & > a {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px; border-bottom: 1px solid #e5e7eb; text-decoration: none;
    border-radius: 8px; transition: background-color 0.2s;
  }
  & > a:hover { background-color: #f9fafb; }
  &:last-child > a { border-bottom: none; }
`;
const StallName = styled.span`
  font-weight: 600; color: #1f2937;
`;
// --- This style is new/renamed ---
const StallPhone = styled.span`
  font-size: 0.875rem; color: #6b7280;
`;
// --- End of Styling ---

export default function StallListPage() {
  const [stalls, setStalls] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStalls = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/stalls');
      setStalls(response.data); 
    } catch (err) {
      console.error("Error fetching stalls:", err);
      setError("Failed to fetch stalls. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
  }, []);

  return (
    <> 
      <PageHeaderContainer>
        <PageHeader>Stall Management</PageHeader>
        <Button to="/stalls/new">
          + Create New Stall
        </Button>
      </PageHeaderContainer>

      {loading ? (
        <LoadingText>Loading stalls...</LoadingText>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <Section>
          <List>
            {stalls.length === 0 ? (
              <p style={{padding: '16px'}}>No stalls found. Click "Create New Stall" to start!</p>
            ) : (
              stalls.map((stall) => (
                <ListItem key={stall.stall_id}>
                  <Link to={`/stall/${stall.stall_id}/sales`}>
                    <StallName>{stall.stall_name}</StallName>
                    {/* --- Use StallPhone component and owner_phone --- */}
                    <StallPhone>{stall.owner_phone}</StallPhone>
                  </Link>
                </ListItem>
              ))
            )}
          </List>
        </Section>
      )}
    </>
  );
}
