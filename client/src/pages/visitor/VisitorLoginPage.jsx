import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { publicAxios } from '../../utils/apiAdapters';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
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
const IdentifierInput = styled.input` ${CommonInputStyles} `; // Renamed from PhoneInput
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

// --- NEW STYLES for Login Type Toggle ---
const ToggleGroup = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  margin-bottom: 20px;
`;
const ToggleButton = styled.button`
  padding: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 10px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;

  background-color: ${props => props.active ? '#eef2ff' : '#f8fafc'};
  color: ${props => props.active ? '#4f46e5' : '#64748b'};
  border-color: ${props => props.active ? '#6366f1' : '#e2e8f0'};
`;

const RegisterLink = styled(Link)`
  display: block;
  margin-top: 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6366f1;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

// --- COMPONENT ---

export default function VisitorLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clubSlug } = useParams();
  const { login } = useVisitorAuth();

  const [loginType, setLoginType] = useState('phone'); // 'phone' or 'member'
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [isIdentifierCached, setIsIdentifierCached] = useState(false); // Renamed

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

    // --- UPDATED: Check for generic cached login ---
    const cachedIdentifier = localStorage.getItem('activ_visitor_identifier');
    const cachedLoginType = localStorage.getItem('activ_visitor_loginType');
    if (cachedIdentifier && cachedLoginType) {
      setIdentifier(cachedIdentifier);
      setLoginType(cachedLoginType);
      setIsIdentifierCached(true); // Enable PIN-only mode
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
    if (identifier.length === 0) { setError("Please enter your Phone or Member ID."); return; }
    if (pin.length !== 6) { setError("Please enter your 6-digit PIN."); return; }
    
    setError(null);
    setLoading(true);

    try {
      // --- UPDATED: Send loginType and identifier ---
      const res = await publicAxios.post('/visitor/login', {
        loginType: loginType,
        identifier: identifier,
        event_id: eventId,
        pin: pin
      });

      // --- UPDATED: Cache both loginType and identifier ---
      localStorage.setItem('activ_visitor_loginType', loginType);
      localStorage.setItem('activ_visitor_identifier', identifier);
      
      login(res.data.wallet, res.data.token);
      
      // Navigate to wallet page if no stall is specified
      navigate(stallId ? `/v/stall/${stallId}` : '/v/wallet'); 

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
    // --- UPDATED: Clear new local storage keys ---
    localStorage.removeItem('activ_visitor_identifier');
    localStorage.removeItem('activ_visitor_loginType');
    setIdentifier('');
    setLoginType('phone'); // Reset to default
    setIsIdentifierCached(false);
    setError(null);
  };

  // Helper to mask identifier
  const maskIdentifier = (id) => id.length === 10 ? `${id.slice(0,3)}****${id.slice(7)}` : id;

  const getSubtitle = () => {
    if (isIdentifierCached) {
      return <>Enter PIN for <strong>{maskIdentifier(identifier)}</strong></>
    }
    if (loginType === 'phone') {
      return 'Enter your registered phone and PIN to access your wallet.'
    }
    return 'Enter your Member ID and PIN to access your wallet.'
  };

  return (
    <PageContainer>
      <LoginCard>
        {clubBranding?.logo_url ? <ClubLogo src={clubBranding.logo_url} /> : <div style={{fontSize: '3rem', marginBottom: 16}}>🔐</div>}
        
        <WelcomeTitle>
          {isIdentifierCached ? 'Welcome Back!' : 'Visitor Login'}
        </WelcomeTitle>
        
        <Subtitle>{getSubtitle()}</Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleLogin}>
          {/* --- Show login type toggle ONLY if not cached --- */}
          {!isIdentifierCached && (
            <ToggleGroup>
              <ToggleButton type="button" active={loginType === 'phone'} onClick={() => setLoginType('phone')}>
                Use Phone
              </ToggleButton>
              <ToggleButton type="button" active={loginType === 'member'} onClick={() => setLoginType('member')}>
                Use Member ID
              </ToggleButton>
            </ToggleGroup>
          )}

          {/* --- Show identifier input ONLY if not cached --- */}
          {!isIdentifierCached && (
            <InputGroup>
              <Label htmlFor="identifier">
                {loginType === 'phone' ? 'Mobile Number' : 'Membership ID'}
              </Label>
              <IdentifierInput 
                id="identifier" 
                type={loginType === 'phone' ? 'tel' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(loginType === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)}
                placeholder={loginType === 'phone' ? '98765 43210' : 'Your Member ID'}
                autoComplete={loginType === 'phone' ? 'tel' : 'off'}
                required={!isIdentifierCached}
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label htmlFor="pin">6-Digit PIN</Label>
            <PinInput 
              id="pin" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••" autoComplete="off" required autoFocus={isIdentifierCached}
            />
          </InputGroup>

          <LoginButton type="submit" disabled={loading || identifier.length < 1 || pin.length < 6 || !eventId}>
            {loading ? 'Verifying...' : 'Unlock Wallet →'}
          </LoginButton>
        </Form>

        {isIdentifierCached && (
          <SwitchAccountButton onClick={clearCache}>
            Not {maskIdentifier(identifier)}? Switch Account
          </SwitchAccountButton>
        )}

        <RegisterLink to={`/${clubSlug}/v/register?event=${eventId}`}>
          Don't have a wallet? <strong>Register here</strong>
        </RegisterLink>

      </LoginCard>
    </PageContainer>
  );
}
