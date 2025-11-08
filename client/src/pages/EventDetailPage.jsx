import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

// --- Styling ---
const PageHeader = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 24px;
`;

const LoadingText = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
`;

const BackLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 16px;
  display: inline-block;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Section = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const Button = styled(Link)`
  background-color: #2563eb;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: none;
  transition: background-color 0.2s;
  &:hover {
    background-color: #1d4ed8;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const ItemDetails = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

// --- NEW: Delete button for list items ---
const ItemDeleteButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  margin-left: 16px;
  
  &:hover {
    color: #ef4444;
    text-decoration: underline;
  }
`;
// --- End of new styles ---

export default function EventDetailPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true); // Ensure loading is true on refetch
      const [eventRes, stallsRes, cashiersRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/events/${id}`),
        axios.get(`http://localhost:3001/api/events/${id}/stalls`),
        axios.get(`http://localhost:3001/api/events/${id}/cashiers`)
      ]);
      
      setEvent(eventRes.data);
      setStalls(stallsRes.data);
      setCashiers(cashiersRes.data);
    } catch (err) {
      console.error("Error fetching event data:", err);
      setError("Failed to fetch event data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- NEW: Delete Stall Handler ---
  const handleDeleteStall = async (stallId) => {
    if (!window.confirm("Are you sure you want to delete this stall?\nAll its data (menu, orders, etc.) will be lost.")) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:3001/api/events/${id}/stalls/${stallId}`);
      // Update UI instantly
      setStalls(prevStalls => prevStalls.filter(stall => stall.stall_id !== stallId));
    } catch (err) {
      console.error("Error deleting stall:", err);
      alert("Failed to delete stall.");
    }
  };

  if (loading) {
    return <LoadingText>Loading event details...</LoadingText>;
  }

  if (error || !event) {
    return <LoadingText style={{ color: 'red' }}>{error || 'Event not found.'}</LoadingText>;
  }

  return (
    <>
      <BackLink to="/">&larr; Back to Dashboard</BackLink>
      <PageHeader>{event.event_name}</PageHeader>
      
      <Section>
        <SectionHeader>
          <SectionTitle>Stall Management</SectionTitle>
          <Button to={`/event/${id}/add-stall`}>
            + Add New Stall
          </Button>
        </SectionHeader>
        <List>
          {stalls.length === 0 ? (
            <ListItem as="div">
              <p>No stalls have been added to this event yet.</p>
            </ListItem>
          ) : (
            stalls.map((stall) => (
              <ListItem key={stall.stall_id}>
                <div>
                  <Link to={`/stall/${stall.stall_id}/sales`}> {/* This link doesn't exist yet, but we'll build it in 4.3 */}
                    <ItemName>{stall.stall_name}</ItemName>
                  </Link>
                  <ItemDetails style={{display: 'block', marginTop: '4px'}}>
                    {stall.owner_phone}
                  </ItemDetails>
                </div>
                {/* --- NEW: Delete button for each stall --- */}
                <ItemDeleteButton onClick={() => handleDeleteStall(stall.stall_id)}>
                  Delete
                </ItemDeleteButton>
              </ListItem>
            ))
          )}
        </List>
      </Section>
      
      <Section>
        <SectionHeader>
          <SectionTitle>Cashier Management</SectionTitle>
          <Button to={`/event/${id}/add-cashier`}>
            + Add New Cashier
          </Button>
        </SectionHeader>
        <List>
          {cashiers.length === 0 ? (
            <ListItem as="div">
              <p>No cashiers have been added to this event yet.</p>
            </ListItem>
          ) : (
            cashiers.map((cashier) => (
              <ListItem key={cashier.cashier_id}>
                <ItemName>{cashier.cashier_name}</ItemName>
                <ItemDetails>
                  PIN: ****
                </ItemDetails>
              </ListItem>
            ))
          )}
        </List>
      </Section>
    </>
  );
}
