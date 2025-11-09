import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { publicAxios } from '../../utils/apiAdapters';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useVisitorAuth } from '../../context/VisitorAuthContext';

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  text-align: center;
`;

const LogoPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  background-color: #f1f5f9;
  border-radius: 20px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #94a3b8;
  font-size: 2rem;
`;

const ClubLogo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  object-fit: contain;
  margin: 0 auto 24px;
`;

const WelcomeTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.025em;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 32px 0;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  text-align: left;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
  display: block;
`;

const PhoneInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  font-size: 1.125rem;
  font-weight: 500;
  color: #0f172a;
  background-color: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease-in-out;

  &::placeholder {
    color: #cbd5e1;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background-color: #0f172a;
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background-color: #334155;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background-color: #fef2f2;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 10px;
  margin-bottom: 24px;
  text-align: left;
  border-left: 4px solid #ef4444;
`;

export default function VisitorLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clubSlug } = useParams();
  const { login } = useVisitorAuth();

  const [phone, setPhone] = useState('');
  const [eventId, setEventId] = useState('');
  const [stallId, setStallId] = useState('');
  
  // State for Club Branding (fetched before login)
  const [clubBranding, setClubBranding] = useState(null);
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Club Branding & Parse URL Params on Load
  useEffect(() => {
    const eId = searchParams.get('event');
    const sId = searchParams.get('stall');
    
    if (eId) setEventId(eId);
    if (sId) setStallId(sId);

    if (clubSlug) {
       // We reuse the public organizer route to get branding info
       // This requires a small tweak to that API to return club details even if no events are active,
       // OR we just use the first event to get the club info.
       // For now, let's assume standard event fetching works to get the club name.
       publicAxios.get(`/organizer/public-events/${clubSlug}`)
        .then(res => {
            // Assuming the API returns an array of events, we can try to extract club info
            // if you add it to that API response. 
            // FOR NOW, we will just use a placeholder if the API doesn't return it directly yet.
            // Ideally, you'd create a specific `GET /api/organizer/:slug` route for just branding.
        })
        .catch(() => {
            // Silently fail branding fetch if it's just a login page
        });
    }

    if (!clubSlug) setError("Invalid QR Code: Missing club information.");
    else if (!eId) setError("Invalid QR Code: Missing Event ID.");
  }, [searchParams, clubSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
        setError("Please enter a valid 10-digit phone number.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await publicAxios.post('/visitor/login', {
        visitor_phone: phone,
        event_id: eventId,
      });

      // Login successful - save token and redirect
      login(response.data.wallet, response.data.token);
      
      // If a stall ID is present, go straight to the menu. Otherwise go to wallet home.
      if (stallId) {
          navigate(`/v/stall/${stallId}`);
      } else {
          // We haven't built the main visitor dashboard yet, so for now, stay here or add a temporary redirect.
          alert("Login successful! Scan a stall QR code to order.");
      }

    } catch (err) {
      console.error("Login error:", err);
      // Give a user-friendly error message
      if (err.response?.status === 404) {
          setError("No wallet found for this event. Please visit a cashier to top-up first.");
      } else {
          setError(err.response?.data?.error || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginCard>
        {/* Placeholder for Club Logo - Replace with actual image tag when data is available */}
        {clubBranding?.logo_url ? (
            <ClubLogo src={clubBranding.logo_url} alt="Club Logo" />
        ) : (
            <LogoPlaceholder>🎫</LogoPlaceholder>
        )}
        
        <WelcomeTitle>
            {clubBranding?.club_name || 'Event Wallet'}
        </WelcomeTitle>
        <Subtitle>
            Enter your phone number to securely access your tokens and standard membership benefits.
        </Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label htmlFor="phone">Mobile Number</Label>
            <PhoneInput 
              id="phone"
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} // Only allow digits, max 10
              placeholder="98765 43210"
              autoComplete="tel"
              autoFocus
              required
            />
          </InputGroup>

          <LoginButton type="submit" disabled={loading || phone.length < 10 || !eventId}>
            {loading ? 'Verifying...' : 'Access Secure Wallet →'}
          </LoginButton>
        </Form>
      </LoginCard>
    </PageContainer>
  );
}
