import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCashierAuth } from '../../context/CashierAuthContext';

// --- This is our "Private Route" hook ---
const usePrivateRoute = () => {
  const { token } = useCashierAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate('/cashier-login');
    }
  }, [token, navigate]);
};

// --- Styling (White & Purple Theme) ---
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb; /* gray-50 */
`;
const Header = styled.header`
  background-color: white;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
`;
const LogoutButton = styled.button`
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  &:hover {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;
const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  gap: 24px;
`;
const FormContainer = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05);
  width: 100%;
  max-width: 500px; /* Made it a bit wider */
`;
const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
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
    border-color: #7c3aed; /* PURPLE accent */
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
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;
// --- New Button Styles ---
const RefundButton = styled(Button)`
  background-color: #dc2626; /* red-600 */
  &:hover {
    background-color: #b91c1c; /* red-700 */
  }
`;
const CheckBalanceButton = styled(Button)`
  background-color: #2563eb; /* blue-600 */
  &:hover {
    background-color: #1d4ed8; /* blue-700 */
  }
`;
const MessageContainer = styled.div`
  width: 100%;
  max-width: 500px;
  text-align: left; /* Aligned left for clarity */
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  
  /* Dynamic styling based on props */
  background-color: ${props => props.type === 'success' ? '#f0fdf4' : '#fef2f2'};
  color: ${props => props.type === 'success' ? '#16a34a' : '#ef4444'};
  border: 1px solid ${props => props.type === 'success' ? '#86efac' : '#fca5a5'};
`;
// --- End of Styling ---

// --- The Page Component ---
export default function CashierDashboardPage() {
  usePrivateRoute(); // This secures the page
  const { logout, cashier } = useCashierAuth();
  const navigate = useNavigate();

  // --- STATE ---
  // TODO: Get this ID from your DBeaver (SELECT * FROM Events)
  const [eventId, setEventId] = useState('PASTE_YOUR_EVENT_ID_HERE');

  // State for all forms
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  
  // State for loading and messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/cashier-login');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // --- "CHECK BALANCE" FUNCTION ---
  const handleCheckBalance = async () => {
    clearMessages();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/cashier/check-balance', {
        visitor_phone: phone,
        event_id: eventId, 
      });
      // This is the check you asked for
      setSuccess(`Balance for ${phone}: ₹${parseFloat(response.data.current_balance).toFixed(2)}`);
    } catch (err) {
      console.error("Error checking balance:", err);
      setError(err.response?.data?.error || "Failed to check balance.");
    } finally {
      setLoading(false);
    }
  };

  // --- "TOP UP" FUNCTION ---
  const handleTopUp = async (e) => {
    e.preventDefault(); // This is a form submission
    clearMessages();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/cashier/topup', {
        visitor_phone: phone,
        amount: parseFloat(amount),
        event_id: eventId, 
      });
      // This is the success message with Transaction ID you asked for
      setSuccess(`Transaction ID: ${response.data.transaction_id}. New balance for ${response.data.visitor_phone} is ₹${parseFloat(response.data.new_balance).toFixed(2)}`);
      setPhone(''); // Clear all fields
      setAmount('');
    } catch (err) {
      console.error("Error during top-up:", err);
      setError(err.response?.data?.error || "Top-up failed.");
    } finally {
      setLoading(false);
    }
  };
  
  // --- "REFUND" FUNCTION ---
  const handleRefund = async () => {
    clearMessages();
    
    if (!window.confirm(`Are you sure you want to refund the *entire* balance for ${phone}? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/cashier/refund', {
        visitor_phone: phone,
        event_id: eventId,
      });
      setSuccess(`REFUNDED: Give ₹${parseFloat(response.data.refundedAmount).toFixed(2)} cash to customer. (Txn ID: ${response.data.transaction_id})`);
      setPhone('');
      setAmount('');
    } catch (err) {
      console.error("Error during refund:", err);
      setError(err.response?.data?.error || "Refund failed.");
    } finally {
      setLoading(false);
    }
  };


  // --- THE "UI" ---
  return (
    <PageContainer>
      <Header>
        <LogoText>Cashier Portal</LogoText>
        <LogoutButton onClick={handleLogout}>
          Logout (Cashier: {cashier ? cashier.name : '...'})
        </LogoutButton>
      </Header>
      
      <MainContent>
        
        {/* Central message box */}
        {/* We show success OR error, not both */}
        {success && <MessageContainer type="success">{success}</MessageContainer>}
        {error && <MessageContainer type="error">{error}</MessageContainer>}

        {/* --- Main Form --- */}
        <FormContainer>
          <SectionTitle>Visitor Wallet Manager</SectionTitle>
          <Form onSubmit={handleTopUp}>
            <InputGroup>
              <Label htmlFor="event_id">Active Event ID</Label>
              <Input
                id="event_id"
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Ask Admin for Event ID"
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label htmlFor="topUpPhone">Visitor Phone Number</Label>
              <Input 
                id="topUpPhone"
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label htmlFor="topUpAmount">Amount to Add (₹)</Label>
              <Input 
                id="topUpAmount"
                type="number"
                min="0"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
              />
            </InputGroup>
            
            <Button type="submit" disabled={loading || !phone || !eventId || !amount}>
              {loading ? 'Processing...' : 'Top Up Wallet'}
            </Button>
            
            <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0'}} />
            
            {/* --- NEW CHECK/REFUND BUTTONS --- */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <CheckBalanceButton 
                type="button" 
                onClick={handleCheckBalance} 
                disabled={loading || !phone || !eventId}
              >
                Check Balance
              </CheckBalanceButton>
              <RefundButton 
                type="button" 
                onClick={handleRefund} 
                disabled={loading || !phone || !eventId}
              >
                Refund Full Balance
              </RefundButton>
            </div>
          </Form>
        </FormContainer>
        
      </MainContent>
    </PageContainer>
  );
}
