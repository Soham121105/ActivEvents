import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'; // --- UPDATED ---
import { useVisitorAuth } from '../../context/VisitorAuthContext';

// --- Styling (remains the same) ---
const PageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
`;
const LoginBox = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px 48px;
  box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05);
  width: 100%;
  max-width: 400px;
`;
const PageHeader = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-top: 0;
  margin-bottom: 24px;
`;
const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;
const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;
const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;
const Input = styled.input`
  background-color: white;
  border: 1px solid #d1d5db;
  color: #111827;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
  }
`;
const Button = styled.button`
  background-color: #7c3aed;
  color: white;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  margin-top: 8px;
  &:hover {
    background-color: #6d28d9;
  }
  &:disabled {
    background-color: #9ca3af;
  }
`;
const ErrorMessage = styled.p`
  font-size: 0.875rem;
  color: #ef4444;
  text-align: center;
  margin: 0;
`;
// --- End of Styling ---

export default function VisitorLoginPage() {
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const { clubSlug } = useParams(); // --- NEW: Get club slug from URL ---
  const { login } = useVisitorAuth();

  const [phone, setPhone] = useState('');
  const [eventId, setEventId] = useState('');
  const [stallId, setStallId] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // This runs once on load to get data from the QR Code URL
  useEffect(() => {
    const event_id_from_url = searchParams.get('event');
    const stall_id_from_url = searchParams.get('stall');
    
    if (!clubSlug) {
      setError("Invalid Club URL. Please scan a valid QR code.");
    }

    if (event_id_from_url) {
      setEventId(event_id_from_url);
    } else {
      setError("Invalid URL: Event ID is missing.");
    }
    
    if (stall_id_from_url) {
      setStallId(stall_id_from_url);
    } else {
      setError("Invalid URL: Stall ID is missing.");
    }
  }, [searchParams, clubSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/visitor/login', {
        visitor_phone: phone,
        event_id: eventId,
      });

      // Log the user in
      login(response.data.wallet, response.data.token);
      
      setLoading(false);
      // Redirect to the stall menu page, preserving the event ID
      // The :clubSlug is NOT needed here anymore because the stall/event IDs are all globally unique
      navigate(`/v/stall/${stallId}?event=${eventId}`);

    } catch (err) {
      console.error("Error logging in:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginBox>
        <PageHeader>Welcome to the Event!</PageHeader>
        <p style={{textAlign: 'center', color: '#6b7280', marginTop: '-16px', marginBottom: '24px'}}>
          Enter your phone number to access your wallet.
        </p>
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone"
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
            />
          </InputGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" disabled={loading || !eventId || !stallId || !clubSlug}>
            {loading ? 'Logging in...' : 'Access Wallet'}
          </Button>
        </Form>
      </LoginBox>
    </PageContainer>
  );
}
