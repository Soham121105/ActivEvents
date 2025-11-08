import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// --- Styling ---
// We can re-use the styled-components we created for the EventListPage
// To do this cleanly, we can create a file for "shared" styles later,
// but for now, we will redefine them here for simplicity.

const Section = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
`;

const Form = styled.form`
  /* We'll use a 2-col grid for the list and form */
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
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
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  grid-column: span 2; /* Make the button span both columns */
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
  padding: 16px;
  border-bottom: 1px solid #e5e7eb; /* gray-200 */

  &:last-child {
    border-bottom: none;
  }
`;

const StallName = styled.span`
  font-weight: 600;
  color: #1f2937; /* gray-800 */
`;

const StallDetails = styled.span`
  font-size: 0.875rem;
  color: #6b7280; /* gray-500 */
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

// --- The Component ---
// This component receives the 'eventId' from its parent page
export default function StallManager({ eventId }) {
  // --- STATE ---
  const [stalls, setStalls] = useState([]);
  const [error, setError] = useState(null);
  
  // State for the "Add Stall" form
  const [stallName, setStallName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [commissionRate, setCommissionRate] = useState('0.20'); // Default to 20%

  // --- 1. THE "GET" REQUEST ---
  const fetchStalls = async () => {
    try {
      // We call our new API to get stalls FOR THIS EVENT
      const response = await axios.get(`http://localhost:3001/api/events/${eventId}/stalls`);
      setStalls(response.data);
    } catch (err) {
      console.error("Error fetching stalls:", err);
      setError("Failed to fetch stalls. Is the backend server running?");
    }
  };

  // Run fetchStalls() once when the component loads
  useEffect(() => {
    if (eventId) {
      fetchStalls();
    }
  }, [eventId]); // Re-run if the eventId ever changes

  // --- 2. THE "POST" REQUEST ---
  const handleAddStall = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Call our new API to create the stall and link it
      const response = await axios.post(`http://localhost:3001/api/events/${eventId}/stalls`, {
        stall_name: stallName,
        owner_email: ownerEmail,
        commission_rate: parseFloat(commissionRate), // Send as a number
      });

      // Add the new stall to our list
      setStalls([...stalls, response.data]);

      // Clear the form
      setStallName('');
      setOwnerEmail('');
      setCommissionRate('0.20');

    } catch (err) {
      console.error("Error adding stall:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); // Show specific error from backend
      } else {
        setError("Failed to add stall.");
      }
    }
  };

  // --- 3. THE "UI" ---
  return (
    <Section>
      <SectionTitle>Stall Management</SectionTitle>
      
      {/* Show an error message if one exists */}
      {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}

      {/* --- Add Stall Form --- */}
      <Form onSubmit={handleAddStall}>
        <InputGroup>
          <Label htmlFor="stall_name">Stall Name</Label>
          <Input 
            id="stall_name"
            type="text" 
            value={stallName}
            onChange={(e) => setStallName(e.target.value)}
            placeholder="e.g., Gupta Chaat House"
            required
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="owner_email">Stall Owner Email</Label>
          <Input 
            id="owner_email"
            type="email" 
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@email.com"
            required
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="commission_rate">Commission (e.g., 0.2 for 20%)</Label>
          <Input 
            id="commission_rate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            required
          />
        </InputGroup>
        {/* Empty div for grid alignment */}
        <div></div> 
        
        <Button type="submit">Add New Stall</Button>
      </Form>

      {/* --- List of Existing Stalls --- */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginTop: '32px' }}>
        Approved Stalls
      </h3>
      <List>
        {stalls.length === 0 ? (
          <ListItem>
            <p>No stalls have been added to this event yet.</p>
          </ListItem>
        ) : (
          stalls.map((stall) => (
            <ListItem key={stall.stall_id}>
              <StallName>{stall.stall_name}</StallName>
              <StallDetails>
                {stall.owner_email} | {(stall.commission_rate * 100).toFixed(0)}% Commission
              </StallDetails>
            </ListItem>
          ))
        )}
      </List>
    </Section>
  );
}
