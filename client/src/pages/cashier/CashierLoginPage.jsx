import { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

// --- Styling (White & Purple Theme) ---
const PageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb; /* gray-50 */
`;
const LoginBox = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 12px;
  padding: 32px 48px;
  box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05);
  width: 100%;
  max-width: 400px;
`;
const PageHeader = styled.h1`
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  color: #111827; /* gray-900 */
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
    border-color: #7c3aed; /* Our new PURPLE accent */
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
  }
`;
const Button = styled.button`
  background-color: #7c3aed; /* PURPLE-600 */
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
    background-color: #6d28d9; /* PURPLE-700 */
  }
  &:disabled {
    background-color: #9ca3af; /* gray-400 */
    cursor: not-allowed;
  }
`;
const ErrorMessage = styled.p`
  font-size: 0.875rem;
  color: #ef4444; /* red-500 */
  text-align: center;
  margin: 0;
`;
// --- End of Styling ---

export default function CashierLoginPage() {
  const navigate = useNavigate(); 
  const { login } = useCashierAuth();
  const [cashierName, setCashierName] = useState('Main Cashier');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/cashier/login', {
        cashier_name: cashierName,
        pin: pin,
      });

      login(response.data.cashier, response.data.token);
      setLoading(false);
      navigate('/cashier/dashboard');

    } catch (err) {
      console.error("Error logging in:", err);
      localStorage.removeItem('cashier_token'); 
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
        <PageHeader>Cashier Login</PageHeader>
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label htmlFor="cashier_name">Cashier Name</Label>
            <Input 
              id="cashier_name"
              type="text" 
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="pin">4-Digit PIN</Label>
            <Input 
              id="pin"
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g., 1234"
              required
            />
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
      </LoginBox>
    </PageContainer>
  );
}
