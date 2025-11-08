import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
// We import 'useParams' (to read the ID) and 'Link' (for all our new buttons)
import { useParams, Link } from 'react-router-dom';

// --- Styling ---
const PageHeader = styled.h1`
  font-size: 2.25rem; /* 36px */
  font-weight: 800;
  color: #111827; /* gray-900 */
  margin-bottom: 24px;
`;

const LoadingText = styled.p`
  font-size: 1.125rem;
  color: #6b7280; /* gray-500 */
`;

const BackLink = styled(Link)`
  color: #2563eb; /* blue-600 */
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
  border: 1px solid #e5e7eb; /* gray-200 */
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

// This is our "Add" button
const Button = styled(Link)`
  background-color: #2563eb; /* blue-600 */
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
    background-color: #1d4ed8; /* blue-700 */
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
  border-bottom: 1px solid #e5e7eb; /* gray-200 */
  text-decoration: none;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #1f2937; /* gray-800 */
`;

const ItemDetails = styled.span`
  font-size: 0.875rem;
  color: #6b7280; /* gray-500 */
`;

// --- The Page Component (Updated) ---
export default function EventDetailPage() {
  const { id } = useParams(); // Get the event ID from the URL

  // --- STATE ---
  const [event, setEvent] = useState(null);
  const [stalls, setStalls] = useState([]); // A new state to hold the stalls
  const [cashiers, setCashiers] = useState([]); // A new state to hold cashiers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 3. Fetch ALL event data (details, stalls, and cashiers) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // We use Promise.all to run all 3 API calls at the same time
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

    fetchData();
  }, [id]); // Re-run if the 'id' in the URL changes

  // --- RENDER LOGIC ---
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
      
      {/* --- This is the new "Stall Management" hub --- */}
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
                {/* This will be the link to the stall's sales page */}
                <Link to={`/stall/${stall.stall_id}/sales`}>
                  <ItemName>{stall.stall_name}</ItemName>
                </Link>
                <ItemDetails>
                  {stall.owner_phone}
                </ItemDetails>
              </ListItem>
            ))
          )}
        </List>
      </Section>
      
      {/* --- This is the new "Cashier Management" hub --- */}
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
                  {/* We will show the generated PIN here later */}
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
