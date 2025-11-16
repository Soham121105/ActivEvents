import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAxios } from '../utils/apiAdapters';
import { Link } from 'react-router-dom';

// ... (All styled components remain the same) ...
const PageHeaderContainer = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; @media (max-width: 768px) { flex-direction: column; align-items: flex-start; gap: 16px; } `;
const PageHeader = styled.h1` font-size: 2.25rem; font-weight: 800; color: #111827; margin-top: 0; margin-bottom: 0; `;
const Button = styled(Link)` background-color: #2563eb; color: white; font-weight: 600; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; text-decoration: none; transition: background-color 0.2s; &:hover { background-color: #1d4ed8; } @media (max-width: 768px) { width: 100%; text-align: center; } `;
const LoadingText = styled.p` font-size: 1.125rem; color: #6b7280; `;
const Section = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); `;
const SectionTitle = styled.h2` font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; `;
const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; @media (max-width: 768px) { grid-template-columns: 1fr; } `;
const StatCard = styled(Section)` margin-bottom: 0; `;
const StatValue = styled.p` font-size: 2.25rem; font-weight: 700; color: #2563eb; margin: 0 0 8px 0; `;
const StatLabel = styled.p` font-size: 0.875rem; font-weight: 500; color: #6b7280; margin: 0; `;
const EventGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; `;
const EventCard = styled(Link)` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); text-decoration: none; color: inherit; transition: all 0.2s ease-in-out; display: flex; flex-direction: column; &:hover { box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.08); transform: translateY(-4px); } `;
const EventCardName = styled.h3` font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-top: 0; margin-bottom: 8px; `;
const EventCardDate = styled.p` font-size: 0.875rem; color: #6b7280; margin: 0; `;
const EventCardFooter = styled.div` margin-top: auto; padding-top: 16px; display: flex; justify-content: flex-end; `;
const DeleteButton = styled.button` background: transparent; border: none; color: #9ca3af; font-weight: 500; font-size: 0.875rem; cursor: pointer; padding: 4px; transition: color 0.2s; &:hover { color: #ef4444; text-decoration: underline; } `;


export default function EventListPage() {
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      const response = await adminAxios.get('/events');
      setEvents(response.data); 
    } catch (err) {
      // --- THIS IS THE FIX ---
      // If the error is an AuthError, we don't set state
      // because the component is already being unmounted.
      if (err.name !== 'AuthError') {
        console.error("Error fetching events:", err);
        setError("Failed to fetch events.");
      }
      // --- END OF FIX ---
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []); // Empty array ensures this runs only once on mount

  const handleDeleteEvent = async (e, eventId) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (!window.confirm("ARE YOU SURE?\n\nThis will delete the event AND all its data. This action cannot be undone.")) {
      return;
    }

    try {
      await adminAxios.delete(`/events/${eventId}`);
      setEvents(prevEvents => prevEvents.filter(event => event.event_id !== eventId));
    } catch (err) {
      if (err.name !== 'AuthError') {
        console.error("Error deleting event:", err);
        alert("Failed to delete the event.");
      }
    }
  };

  if (loading) return <LoadingText>Loading events...</LoadingText>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <> 
      <PageHeaderContainer>
        <PageHeader>Event Dashboard</PageHeader>
        <Button to="/create-event">+ Create New Event</Button>
      </PageHeaderContainer>

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
      
      <Section style={{ marginTop: '24px' }}>
        <SectionTitle>Upcoming Events</SectionTitle>
        <EventGrid>
          {events.length === 0 ? <p>No events found. Click "Create New Event" to start!</p> : (
            events.map((event) => (
              <EventCard key={event.event_id} to={`/event/${event.event_id}`}>
                <div>
                  <EventCardName>{event.event_name}</EventCardName>
                  <EventCardDate>{new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</EventCardDate>
                </div>
                <EventCardFooter>
                  <DeleteButton onClick={(e) => handleDeleteEvent(e, event.event_id)}>Delete Event</DeleteButton>
                </EventCardFooter>
              </EventCard>
            ))
          )}
        </EventGrid>
      </Section>
    </>
  );
}
