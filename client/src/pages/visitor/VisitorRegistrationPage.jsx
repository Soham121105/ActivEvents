import { useState } from 'react'; // Removed useEffect
import styled from 'styled-components';
import { publicAxios } from '../../utils/apiAdapters';
import { useSearchParams, Link, useParams } from 'react-router-dom'; // Removed useNavigate

// --- STYLED COMPONENTS (Unchanged) ---
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  padding: 20px;
`;
const Card = styled.div`
  background: white;
  width: 100%;
  max-width: 440px;
  padding: 40px 32px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
  text-align: center;
`;
const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 0;
  margin-bottom: 12px;
`;
const Text = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.5;
`;
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  font-size: 1.1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;
const Button = styled.button`
  width: 100%;
  padding: 16px;
  background: #0f172a;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  text-decoration: none; /* For 'as={Link}' */
  margin-top: 16px;
  &:disabled {
    opacity: 0.7;
  }
`;
const ErrorMessage = styled.p`
  color: #dc2626;
  background: #fee2e2;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  text-align: left;
`;
const ToggleWrap = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;
const Toggle = styled.div`
  position: relative;
  width: 48px;
  height: 26px;
  background: ${(p) => (p.checked ? '#6366f1' : '#cbd5e1')};
  border-radius: 99px;
  transition: all 0.2s;
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transform: translateX(${(p) => (p.checked ? '22px' : '0')});
    transition: all 0.2s;
  }
`;
// --- End of Styles ---


export default function VisitorRegistrationPage() {
  const [searchParams] = useSearchParams();
  const { clubSlug } = useParams();
  const eventId = searchParams.get('event');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [membershipId, setMembershipId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (phone.length !== 10) {
      setError('Mobile number must be 10 digits.');
      return;
    }
    if (pin.length !== 6) {
      setError('Your PIN must be exactly 6 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match. Please re-enter.');
      return;
    }
    if (isMember && !membershipId) {
      setError('Please enter your Membership ID.');
      return;
    }

    setLoading(true);
    try {
      await publicAxios.post('/visitor/register', {
        visitor_phone: phone,
        visitor_name: name || null,
        event_id: eventId,
        pin: pin,
        membership_id: isMember ? membershipId : null,
      });
      localStorage.setItem('activ_visitor_phone', phone);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err.response?.status === 409
          ? 'This phone number is already registered. Please log in.'
          : 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Success View (FIXED) ---
  // We no longer use useEffect for redirection.
  // We now render a Link as a Button, which is much more stable.
  if (isSuccess) {
    return (
      <PageContainer>
        <Card>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <Title>Wallet Ready!</Title>
          <Text>
            Your wallet is created. You can now log in with your phone number and
            the PIN you just set.
          </Text>
          {/* Use a Link component for a reliable redirect */}
          <Button
            as={Link}
            to={`/${clubSlug}/v/login?event=${eventId}`}
          >
            Go to Login
          </Button>
        </Card>
      </PageContainer>
    );
  }

  // --- Registration Form View (Unchanged) ---
  return (
    <PageContainer>
      <Card>
        <Title>Create Your Wallet</Title>
        <Text>
          Enter your details to create a secure wallet for this event.
        </Text>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleRegister}>
          <InputGroup>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="phone">Mobile Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              required
            />
          </InputGroup>

          <ToggleWrap>
            <input
              type="checkbox"
              checked={isMember}
              onChange={(e) => setIsMember(e.target.checked)}
              style={{ display: 'none' }}
            />
            <Toggle checked={isMember} />
            <span style={{ fontWeight: 600, color: '#334155' }}>
              Are you a Club Member?
            </span>
          </ToggleWrap>

          {isMember && (
            <InputGroup>
              <Label htmlFor="memberId">Membership ID *</Label>
              <Input
                id="memberId"
                type="text"
                placeholder="Enter your membership ID"
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
                required={isMember}
              />
            </InputGroup>
          )}

          <InputGroup>
            <Label htmlFor="pin">Set 6-Digit PIN *</Label>
            <Input
              id="pin"
              type="password"
              placeholder="••••••"
              maxLength={6}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="confirmPin">Confirm 6-Digit PIN *</Label>
            <Input
              id="confirmPin"
              type="password"
              placeholder="••••••"
              maxLength={6}
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
            />
          </InputGroup>

          <Button
            type="submit"
            disabled={
              loading || phone.length < 10 || pin.length < 6 || !eventId
            }
          >
            {loading ? 'Creating...' : 'Create Wallet'}
          </Button>
        </Form>
      </Card>
    </PageContainer>
  );
}
