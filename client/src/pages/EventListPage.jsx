import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- Reusable Styled Components ---
const PageHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const PageHeader = styled.h1`
  font-size: 2.25rem; /* 36px */
  font-weight: 800;
  color: #111827; /* gray-900 */
  margin-top: 0;
  margin-bottom: 0;
`;

const Button = styled(Link)`
  background-color: #2563eb; /* blue-600 */
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  transition: background-color 0.2s;
  &:hover {
    background-color: #1d4ed8; /* blue-700 */
  }
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
  }
`;

const LoadingText = styled.p`
  font-size: 1.125rem;
  color: #6b7280; /* gray-500 */
`;

const Section = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

// --- New Dashboard-Specific Components ---
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  /* Mobile responsiveness */
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(Section)`
  margin-bottom: 0;
`;

const StatValue = styled.p`
  font-size: 2.25rem;
  font-weight: 700;
  color: #2563eb; /* blue-600 */
  margin: 0 0 8px 0;
`;

const StatLabel = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280; /* gray-500 */
  margin: 0;
`;

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

const EventCard = styled(Link)`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.08);
    transform: translateY(-4px);
  }
`;

const EventCardName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-top: 0;
  margin-bottom: 8px;
`;

const EventCardDate = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

// --- The "Event Dashboard" Page Component ---
export default function EventListPage() {
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      // This calls our backend API
      const response = await axios.get('http://localhost:3001/api/events');
      setEvents(response.data); 
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to fetch events. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <> 
      <PageHeaderContainer>
        <PageHeader>Event Dashboard</PageHeader>
        {/* This is the new "Add Event" button you wanted */}
        <Button to="/create-event">
          + Create New Event
        </Button>
      </PageHeaderContainer>

      {/* --- This is the new "Professional" Dashboard Section --- */}
      <StatsGrid>
        <StatCard>
          <StatValue>₹0</StatValue>
          <StatLabel>Total Revenue (Today)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>0</StatValue>
          <StatLabel>Total Transactions (Today)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{events.length}</StatValue>
          <StatLabel>Active / Upcoming Events</StatLabel>
        </StatCard>
      </StatsGrid>
      {/* --- End of new section --- */}
      
      <Section style={{ marginTop: '24px' }}>
        <SectionTitle>Upcoming Events</SectionTitle>
        {loading ? (
          <LoadingText>Loading events...</LoadingText>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <EventGrid>
            {events.length === 0 ? (
              <p>No events found. Click "Create New Event" to start!</p>
            ) : (
              events.map((event) => (
                <EventCard key={event.event_id} to={`/event/${event.event_id}`}>
                  <EventCardName>{event.event_name}</EventCardName>
                  <EventCardDate>
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </EventCardDate>
                </EventCard>
              ))
            )}
          </EventGrid>
        )}
      </Section>
    </>
  );
}
