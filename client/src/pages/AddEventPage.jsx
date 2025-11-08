import { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
// We need 'useNavigate' to redirect the user after they submit
// We need 'Link' for the "Back" button
import { useNavigate, Link } from 'react-router-dom';

// --- Styling ---
// We re-use the same professional style components
const PageHeader = styled.h1`
  font-size: 2.25rem; /* 36px */
  font-weight: 800;
  color: #111827; /* gray-900 */
  margin-bottom: 24px;
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
  max-width: 600px; /* Make the form a nice, clean width */
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr; /* A simple single-column form */
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: #374151; /* gray-700 */
  margin-bottom: 8px;
`;

const Input = styled.input`
  background-color: white;
  border: 1px solid #d1d5db; /* gray-300 */
  color: #111827; /* gray-900 */
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 1rem; /* 16px */
  &:focus {
    outline: none;
    border-color: #2563eb; /* blue-600 */
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

const Button = styled.button`
  background-color: #2563eb; /* blue-600 */
  color: white;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  &:hover {
    background-color: #1d4ed8; /* blue-700 */
  }
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

// --- The Page Component ---
export default function AddEventPage() {
  const navigate = useNavigate(); // Get the redirect function

  // --- STATE ---
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- THE "POST" REQUEST ---
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Call our API to create the event
      // This will use the hardcoded Organizer ID from your backend
      await axios.post('http://localhost:3001/api/events', {
        event_name: eventName,
        event_date: eventDate,
      });

      // --- SUCCESS! ---
      // This is the redirect. It sends the user back to the main dashboard.
      navigate('/');

    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Is the backend server running?");
      setLoading(false); // Stop loading if there was an error
    }
  };

  // --- THE "UI" ---
  return (
    <>
      <BackLink to="/">&larr; Back to Dashboard</BackLink>
      <PageHeader>Create New Event</PageHeader>
      
      <Section>
        <Form onSubmit={handleCreateEvent}>
          {/* Show an error message if one exists */}
          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

          <InputGroup>
            <Label htmlFor="event_name">Event Name</Label>
            <Input 
              id="event_name"
              type="text" 
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Fates & Feats 2025"
              required
            />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="event_date">Event Date</Label>
            <Input 
              id="event_date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save and Create Event'}
          </Button>
        </Form>
      </Section>
    </>
  );
}