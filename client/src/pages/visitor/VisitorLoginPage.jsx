import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { publicAxios } from '../../utils/apiAdapters';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useVisitorAuth } from '../../context/VisitorAuthContext';

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background-color: #f8fafc; padding: 20px;
`;
const LoginCard = styled.div`
  background: white; width: 100%; max-width: 400px; padding: 40px 32px; border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); text-align: center;
`;
const ClubLogo = styled.img`
  width: 80px; height: 80px; border-radius: 20px; object-fit: contain; margin: 0 auto 24px;
`;
const WelcomeTitle = styled.h1`
  font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.025em;
`;
const Subtitle = styled.p`
  font-size: 1rem; color: #64748b; margin: 0 0 32px 0; line-height: 1.5;
`;
const Form = styled.form`
  display: flex; flex-direction: column; gap: 20px;
`;
const InputGroup = styled.div` text-align: left; animation: fadeIn 0.3s ease-out; `;
const Label = styled.label`
  font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 8px; display: block;
`;
const CommonInputStyles = `
  width: 100%; padding: 14px 16px; font-size: 1.125rem; font-weight: 500;
  color: #0f172a; background-color: #fff; border: 2px solid #e2e8f0; border-radius: 12px;
  transition: all 0.2s ease-in-out;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
`;
const PhoneInput = styled.input` ${CommonInputStyles} `;
const PinInput = styled.input`
  ${CommonInputStyles}
  font-size: 1.5rem; text-align: center; letter-spacing: 0.5em; font-family: monospace;
`;
const LoginButton = styled.button`
  width: 100%; padding: 16px; background-color: #0f172a; color: white; font-size: 1.125rem; font-weight: 700;
  border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; margin-top: 8px;
  &:hover:not(:disabled) { background-color: #334155; transform: translateY(-2px); }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled { background-color: #94a3b8; cursor: not-allowed; opacity: 0.7; }
`;
const ErrorMessage = styled.div`
  padding: 12px; background-color: #fef2f2; color: #ef4444; font-size: 0.875rem; font-weight: 600;
  border-radius: 10px; margin-bottom: 24px; text-align: left; border-left: 4px solid #ef4444;
`;
const SwitchAccountButton = styled.button`
  background: none; border: none; color: #6366f1; font-weight: 600; cursor: pointer;
  margin-top: 16px; font-size: 0.9rem;
  &:hover { text-decoration: underline; }
`;

export default function VisitorLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clubSlug } = useParams();
  const { login } = useVisitorAuth();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isPhoneCached, setIsPhoneCached] = useState(false); // Track if we are in "PIN ONLY" mode

  const [eventId, setEventId] = useState('');
  const [stallId, setStallId] = useState('');
  const [clubBranding, setClubBranding] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const eId = searchParams.get('event');
    const sId = searchParams.get('stall');
    if (eId) setEventId(eId);
    if (sId) setStallId(sId);

    // --- MAGIC: Check for cached phone number ---
    const cachedPhone = localStorage.getItem('activ_visitor_phone');
    if (cachedPhone) {
      setPhone(cachedPhone);
      setIsPhoneCached(true); // Enable PIN-only mode
    }

    if (clubSlug) {
       publicAxios.get(`/organizer/public-events/${clubSlug}`)
        .then(res => { /* We could set club branding here if API returned it */ })
        .catch(() => {});
    }
    if (!clubSlug) setError("Invalid QR Code: Missing club info.");
    else if (!eId) setError("Invalid QR Code: Missing Event ID.");
  }, [searchParams, clubSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 10) { setError("Invalid phone number."); return; }
    if (pin.length !== 6) { setError("Please enter your 6-digit PIN."); return; }
    
    setError(null);
    setLoading(true);

    try {
      // We ALWAYS send phone + pin to backend. 
      // If isPhoneCached is true, 'phone' comes from state (loaded from localStorage)
      const res = await publicAxios.post('/visitor/login', {
        visitor_phone: phone,
        event_id: eventId,
        pin: pin
      });

      // Success! Cache phone for next time (redundant if already cached, but safe)
      localStorage.setItem('activ_visitor_phone', phone);
      
      login(res.data.wallet, res.data.token);
      navigate(stallId ? `/v/stall/${stallId}` : '/v/wallet'); // Redirect

    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 401) setError("Incorrect PIN. Please try again.");
      else if (err.response?.status === 404) setError("Wallet not found. Please register first.");
      else setError("Login failed. Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('activ_visitor_phone');
    setPhone('');
    setIsPhoneCached(false);
    setError(null);
  };

  // Helper to mask phone number: 987******10
  const maskPhone = (p) => p.length === 10 ? `${p.slice(0,3)}****${p.slice(7)}` : p;

  return (
    <PageContainer>
      <LoginCard>
        {clubBranding?.logo_url ? <ClubLogo src={clubBranding.logo_url} /> : <div style={{fontSize: '3rem', marginBottom: 16}}>🔐</div>}
        
        <WelcomeTitle>
          {isPhoneCached ? 'Welcome Back!' : 'Visitor Login'}
        </WelcomeTitle>
        
        <Subtitle>
          {isPhoneCached 
            ? <>Enter PIN for <strong>{maskPhone(phone)}</strong></>
            : 'Enter your registered phone and PIN to access your wallet.'}
        </Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleLogin}>
          {/* ONLY SHOW PHONE INPUT IF NOT CACHED */}
          {!isPhoneCached && (
            <InputGroup>
              <Label htmlFor="phone">Mobile Number</Label>
              <PhoneInput 
                id="phone" type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210" autoComplete="tel" required={!isPhoneCached}
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label htmlFor="pin">6-Digit PIN</Label>
            <PinInput 
              id="pin" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••" autoComplete="off" required autoFocus={isPhoneCached}
            />
          </InputGroup>

          <LoginButton type="submit" disabled={loading || phone.length < 10 || pin.length < 6 || !eventId}>
            {loading ? 'Verifying...' : 'Unlock Wallet →'}
          </LoginButton>
        </Form>

        {isPhoneCached && (
          <SwitchAccountButton onClick={clearCache}>
            Not {maskPhone(phone)}? Switch Account
          </SwitchAccountButton>
        )}
      </LoginCard>
    </PageContainer>
  );
}