import { useState } from 'react';
import styled from 'styled-components';
import { publicAxios } from '../../utils/apiAdapters';
import { useSearchParams } from 'react-router-dom';

const PageContainer = styled.div`min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f8fafc; padding: 20px;`;
const Card = styled.div`background: white; width: 100%; max-width: 440px; padding: 40px 32px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); text-align: center;`;
const Title = styled.h1`font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 12px;`;
const Text = styled.p`font-size: 1rem; color: #64748b; margin-bottom: 32px; line-height: 1.5;`;
const Input = styled.input`width: 100%; padding: 14px 16px; font-size: 1.1rem; border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; transition: all 0.2s; &:focus { outline: none; border-color: #6366f1; }`;
const Button = styled.button`width: 100%; padding: 16px; background: #0f172a; color: white; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 14px; cursor: pointer; &:disabled { opacity: 0.7; }`;
const PinBox = styled.div`background: #eef2ff; border: 2px dashed #6366f1; padding: 24px; border-radius: 16px; margin: 32px 0;`;
const PinVal = styled.div`font-size: 3.5rem; font-weight: 900; color: #4f46e5; letter-spacing: 8px; font-variant-numeric: tabular-nums;`;

export default function VisitorRegistrationPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await publicAxios.post('/visitor/register', { visitor_phone: phone, visitor_name: name, event_id: eventId });
      localStorage.setItem('activ_visitor_phone', phone); // Save for later login
      setPin(res.data.pin);
    } catch (err) {
      setError(err.response?.status === 409 ? "Number already registered. Please log in." : "Registration failed.");
    } finally { setLoading(false); }
  };

  if (pin) return (
    <PageContainer>
      <Card>
        <div style={{fontSize: '3rem', marginBottom: 16}}>🎉</div>
        <Title>Wallet Ready!</Title>
        <Text>Go to any cashier to add money. <br/><strong>Save this PIN to log in later.</strong></Text>
        <PinBox>
          <div style={{color:'#6366f1', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8}}>YOUR SECRET PIN</div>
          <PinVal>{pin}</PinVal>
        </PinBox>
        <Button onClick={() => window.location.reload()}>Done</Button>
      </Card>
    </PageContainer>
  );

  return (
    <PageContainer>
      <Card>
        <Title>Create Wallet</Title>
        <Text>Enter your details to get started.</Text>
        {error && <p style={{color:'#dc2626', background:'#fee2e2', padding:12, borderRadius:10, fontWeight:600}}>{error}</p>}
        <form onSubmit={handleRegister}>
          <Input type="tel" placeholder="Mobile Number *" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} required />
          <Input type="text" placeholder="Your Name (Optional)" value={name} onChange={e => setName(e.target.value)} />
          <Button type="submit" disabled={loading || phone.length<10 || !eventId}>{loading ? 'Creating...' : 'Generate PIN'}</Button>
        </form>
      </Card>
    </PageContainer>
  );
}