import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- Styling (Matched to Cashier Login) ---
const PageContainer = styled.div`
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background-color: #f9fafb;
`;
const LoginBox = styled.div`
  background-color: white; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 32px 48px; box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05);
  width: 100%; max-width: 400px;
`;
const PageHeader = styled.h1`
  font-size: 1.875rem; font-weight: 700; color: #111827;
  text-align: center; margin-top: 0; margin-bottom: 24px;
`;
const Form = styled.form`
  display: grid; grid-template-columns: 1fr; gap: 16px;
`;
const InputGroup = styled.div`
  display: flex; flex-direction: column;
`;
const Label = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px;
`;
const Input = styled.input`
  background-color: white; border: 1px solid #d1d5db; color: #111827;
  padding: 10px 14px; border-radius: 8px; font-size: 1rem;
  &:focus {
    outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;
const Select = styled.select`
  background-color: white; border: 1px solid #d1d5db; color: #111827;
  padding: 10px 14px; border-radius: 8px; font-size: 1rem;
  &:focus {
    outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;
const Button = styled.button`
  background-color: #2563eb; color: white; font-weight: 600;
  padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 1rem; transition: background-color 0.2s; margin-top: 8px;
  &:hover { background-color: #1d4ed8; }
  &:disabled { background-color: #9ca3af; cursor: not-allowed; }
`;
const ErrorMessage = styled.p`
  font-size: 0.875rem; color: #ef4444; text-align: center; margin: 0;
`;
// --- End of Styling ---

export default function StallLoginPage() {
  const navigate = useNavigate(); 
  const { login } = useAuth();

  // --- NEW: Logic copied from Cashier Login ---
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch active events on page load
  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:3001/api/events/public/active')
      .then(res => {
        setEvents(res.data);
        if (res.data.length > 0) {
          setSelectedEventId(res.data[0].event_id); // Default to the first event
        }
      })
      .catch(err => {
        console.error("Failed to fetch events", err);
        setError("Could not load active events.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/stalls/login', {
        event_id: selectedEventId,
        phone: phone,
        password: password,
      });

      login(response.data.stall, response.data.token);
      navigate('/stall/dashboard');

    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginBox>
        <PageHeader>Stall Owner Login</PageHeader>
        <Form onSubmit={handleLogin}>
          
          <InputGroup>
            <Label htmlFor="event">Select Event</Label>
            <Select
              id="event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              required
              disabled={events.length === 0}
            >
              {events.length === 0 ? (
                <option>Loading active events...</option>
              ) : (
                events.map(ev => (
                  <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
                ))
              )}
            </Select>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone"
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your 10-digit phone #"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your temporary password"
              required
            />
          </InputGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading || events.length === 0}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
      </LoginBox>
    </PageContainer>
  );
}
