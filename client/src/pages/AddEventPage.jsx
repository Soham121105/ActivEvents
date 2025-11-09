import { useState } from 'react';
import styled from 'styled-components';
// --- CHANGE: Use admin adapter ---
import { adminAxios } from '../utils/apiAdapters';
import { useNavigate, Link } from 'react-router-dom';

// ... (Keep all styled components exactly the same) ...
const PageHeader = styled.h1` font-size: 2.25rem; font-weight: 800; color: #111827; margin-bottom: 24px; `;
const BackLink = styled(Link)` color: #2563eb; text-decoration: none; font-weight: 500; margin-bottom: 16px; display: inline-block; &:hover { text-decoration: underline; } `;
const Section = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); max-width: 600px; `;
const Form = styled.form` display: grid; grid-template-columns: 1fr; gap: 16px; `;
const InputGroup = styled.div` display: flex; flex-direction: column; `;
const Label = styled.label` font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px; `;
const Input = styled.input` background-color: white; border: 1px solid #d1d5db; color: #111827; padding: 10px 14px; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); } `;
const Button = styled.button` background-color: #2563eb; color: white; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; &:hover { background-color: #1d4ed8; } &:disabled { background-color: #9ca3af; cursor: not-allowed; } `;

export default function AddEventPage() {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // --- CHANGE: Use adminAxios ---
      await adminAxios.post('/events', {
        event_name: eventName,
        event_date: eventDate,
      });
      navigate('/');
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event.");
      setLoading(false);
    }
  };

  return (
    <>
      <BackLink to="/">&larr; Back to Dashboard</BackLink>
      <PageHeader>Create New Event</PageHeader>
      <Section>
        <Form onSubmit={handleCreateEvent}>
          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
          <InputGroup>
            <Label htmlFor="event_name">Event Name</Label>
            <Input id="event_name" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Fates & Feats 2025" required />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="event_date">Event Date</Label>
            <Input id="event_date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </InputGroup>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save and Create Event'}</Button>
        </Form>
      </Section>
    </>
  );
}
