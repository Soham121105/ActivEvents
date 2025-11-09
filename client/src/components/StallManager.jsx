import { useState, useEffect } from 'react';
import styled from 'styled-components';
// --- CHANGE: Use admin adapter ---
import { adminAxios } from '../utils/apiAdapters';

// ... (Keep all styled components exactly the same) ...
const Section = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); `;
const Form = styled.form` display: grid; grid-template-columns: 1fr 1fr; gap: 24px; `;
const InputGroup = styled.div` display: flex; flex-direction: column; `;
const Label = styled.label` font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px; `;
const Input = styled.input` background-color: white; border: 1px solid #d1d5db; color: #111827; padding: 10px 14px; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); } `;
const Button = styled.button` background-color: #2563eb; color: white; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; grid-column: span 2; &:hover { background-color: #1d4ed8; } `;
const List = styled.ul` list-style: none; padding: 0; margin: 0; `;
const ListItem = styled.li` display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; &:last-child { border-bottom: none; } `;
const StallName = styled.span` font-weight: 600; color: #1f2937; `;
const StallDetails = styled.span` font-size: 0.875rem; color: #6b7280; `;
const SectionTitle = styled.h2` font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; `;

export default function StallManager({ eventId }) {
  const [stalls, setStalls] = useState([]);
  const [error, setError] = useState(null);
  const [stallName, setStallName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [commissionRate, setCommissionRate] = useState('0.20');

  const fetchStalls = async () => {
    try {
      // --- CHANGE: Use adminAxios ---
      const response = await adminAxios.get(`/events/${eventId}/stalls`);
      setStalls(response.data);
    } catch (err) {
      console.error("Error fetching stalls:", err);
      setError("Failed to fetch stalls.");
    }
  };

  useEffect(() => {
    if (eventId) fetchStalls();
  }, [eventId]);

  const handleAddStall = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // --- CHANGE: Use adminAxios ---
      const response = await adminAxios.post(`/events/${eventId}/stalls`, {
        stall_name: stallName,
        owner_email: ownerEmail,
        commission_rate: parseFloat(commissionRate),
      });
      setStalls([...stalls, response.data]);
      setStallName(''); setOwnerEmail(''); setCommissionRate('0.20');
    } catch (err) {
      console.error("Error adding stall:", err);
      setError(err.response?.data?.error || "Failed to add stall.");
    }
  };

  return (
    <Section>
      <SectionTitle>Stall Management</SectionTitle>
      {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
      <Form onSubmit={handleAddStall}>
        <InputGroup>
          <Label htmlFor="stall_name">Stall Name</Label>
          <Input id="stall_name" type="text" value={stallName} onChange={(e) => setStallName(e.target.value)} placeholder="e.g., Gupta Chaat House" required />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="owner_email">Stall Owner Email</Label>
          <Input id="owner_email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@email.com" required />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="commission_rate">Commission (e.g., 0.2 for 20%)</Label>
          <Input id="commission_rate" type="number" step="0.01" min="0" max="1" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} required />
        </InputGroup>
        <div></div> 
        <Button type="submit">Add New Stall</Button>
      </Form>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginTop: '32px' }}>Approved Stalls</h3>
      <List>
        {stalls.length === 0 ? <ListItem><p>No stalls have been added yet.</p></ListItem> : stalls.map((stall) => (
            <ListItem key={stall.stall_id}>
              <StallName>{stall.stall_name}</StallName>
              <StallDetails>{stall.owner_email} | {(stall.commission_rate * 100).toFixed(0)}% Commission</StallDetails>
            </ListItem>
          ))}
      </List>
    </Section>
  );
}
