import { useState } from 'react';
import styled from 'styled-components';
import { publicAxios } from '../../utils/apiAdapters';
import { useSearchParams, useParams } from 'react-router-dom';

// --- STYLED COMPONENTS (Clean Kiosk Look) ---
const PageContainer = styled.div`
  min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f1f5f9; padding: 20px;
`;
const KioskCard = styled.div`
  background: white; width: 100%; max-width: 480px; padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); text-align: center;
`;
const Title = styled.h1` font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; `;
const Subtitle = styled.p` font-size: 1.1rem; color: #64748b; margin-bottom: 32px; line-height: 1.5; `;
const Input = styled.input`
  width: 100%; padding: 16px 20px; font-size: 1.25rem; border: 2px solid #cbd5e1; border-radius: 12px; margin-bottom: 20px;
  &:focus { outline: none; border-color: #6366f1; }
`;
const Button = styled.button`
  width: 100%; padding: 20px; background-color: #0f172a; color: white; font-size: 1.25rem; font-weight: 700; border: none; border-radius: 16px; cursor: pointer;
  &:disabled { background-color: #94a3b8; }
`;
const PinDisplay = styled.div`
  background: #eef2ff; border: 2px dashed #6366f1; padding: 32px; border-radius: 16px; margin: 32px 0;
`;
const PinCode = styled.div` font-size: 4rem; font-weight: 900; color: #4f46e5; letter-spacing: 8px; font-variant-numeric: tabular-nums; `;
const PinWarning = styled.p` font-size: 1rem; color: #ef4444; font-weight: 600; margin-top: 16px; `;

export default function VisitorRegistrationPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [generatedPin, setGeneratedPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await publicAxios.post('/visitor/register', { visitor_phone: phone, visitor_name: name, event_id: eventId });
      setGeneratedPin(res.data.pin);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally { setLoading(false); }
  };

  if (generatedPin) {
    return (
      <PageContainer>
        <KioskCard>
          <Title>Registration Successful!</Title>
          <Subtitle>Welcome, {name || 'Guest'}.</Subtitle>
          <PinDisplay>
            <div style={{color:'#6366f1', fontWeight: 600, marginBottom: 8}}>YOUR SECRET PIN</div>
            <PinCode>{generatedPin}</PinCode>
            <PinWarning>⚠️ Take a screenshot or remember this! It will not be shown again.</PinWarning>
          </PinDisplay>
          <Button onClick={() => window.location.reload()}>Done (Next Visitor)</Button>
        </KioskCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <KioskCard>
        <Title>Event Registration</Title>
        <Subtitle>Enter your details to create your secure event wallet.</Subtitle>
        {error && <p style={{color: 'red', marginBottom: 16}}>{error}</p>}
        <form onSubmit={handleRegister}>
          <Input type="tel" placeholder="Mobile Number (Required)" value={phone} onChange={e => setPhone(e.target.value)} required />
          <Input type="text" placeholder="Your Name (Optional)" value={name} onChange={e => setName(e.target.value)} />
          <Button type="submit" disabled={loading || !phone || !eventId}>
            {loading ? 'Creating Wallet...' : 'Generate My PIN'}
          </Button>
        </form>
      </KioskCard>
    </PageContainer>
  );
}
