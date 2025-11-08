import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Make sure Link is imported
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

// --- NEW: HeaderContent Styling ---
const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
`;

// --- NEW: NavLink Styling ---
const NavLink = styled(Link)`
  font-weight: 600;
  color: #7c3aed;
  text-decoration: none;
  font-size: 1rem;
  &:hover { text-decoration: underline; }
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
  max-width: 500px;
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

// --- NEW: Styling for the Member Toggle ---
const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
`;
const ToggleCheckbox = styled.input`
  height: 0;
  width: 0;
  opacity: 0;
`;
const ToggleSlider = styled.div`
  width: 38px;
  height: 22px;
  background-color: ${props => props.checked ? '#7c3aed' : '#ccc'};
  border-radius: 22px;
  position: relative;
  transition: background-color 0.2s;
  margin-right: 10px;
  
  &::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: white;
    top: 3px;
    left: 3px;
    transition: transform 0.2s;
    transform: ${props => props.checked ? 'translateX(16px)' : 'translateX(0)'};
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
  text-align: left;
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
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
  // The manual eventId state is GONE. This fixes the bug.
  
  // State for all forms
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  
  // --- NEW STATE for member info ---
  const [visitorName, setVisitorName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [membershipId, setMembershipId] = useState('');
  
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
  
  // --- This function is now BUG-FREE ---
  // It relies on the token for event_id, matching the /topup logic.
  const handleCheckBalance = async () => {
    clearMessages();
    setLoading(true);

    try {
      // We no longer send event_id from the client
      const response = await axios.post('http://localhost:3001/api/cashier/check-balance', {
        visitor_phone: phone,
      });
      setSuccess(`Balance for ${phone}: ₹${parseFloat(response.data.current_balance).toFixed(2)}`);
    } catch (err) {
      console.error("Error checking balance:", err);
      setError(err.response?.data?.error || "Failed to check balance.");
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED Top Up Function ---
  const handleTopUp = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      // We now send the new optional fields
      const response = await axios.post('http://localhost:3001/api/cashier/topup', {
        visitor_phone: phone,
        amount: parseFloat(amount),
        visitor_name: visitorName, // Send the name
        membership_id: isMember ? membershipId : null // Send ID only if member
      });
      
      setSuccess(`Transaction ID: ${response.data.transaction_id}. New balance for ${response.data.visitor_phone} is ₹${parseFloat(response.data.new_balance).toFixed(2)}`);
      
      // Clear all fields on success
      setPhone('');
      setAmount('');
      setVisitorName('');
      setIsMember(false);
      setMembershipId('');

    } catch (err) {
      console.error("Error during top-up:", err);
      setError(err.response?.data?.error || "Top-up failed.");
    } finally {
      setLoading(false);
    }
  };
  
  // --- This function is also BUG-FREE ---
  const handleRefund = async () => {
    clearMessages();
    
    if (!window.confirm(`Are you sure you want to refund the *entire* balance for ${phone}? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    try {
      // We no longer send event_id from the client
      const response = await axios.post('http://localhost:3001/api/cashier/refund', {
        visitor_phone: phone,
      });
      setSuccess(`REFUNDED: Give ₹${parseFloat(response.data.refundedAmount).toFixed(2)} cash to customer. (Txn ID: ${response.data.transaction_id})`);
      setPhone('');
      setAmount('');
      setVisitorName('');
      setIsMember(false);
      setMembershipId('');
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
        {/* --- UPDATED HEADER --- */}
        <HeaderContent>
          <LogoText>Cashier Portal</LogoText>
          <NavLink to="/cashier/log">View My Log</NavLink>
        </HeaderContent>
        {/* --- END OF UPDATE --- */}
        <LogoutButton onClick={handleLogout}>
          Logout (Cashier: {cashier ? cashier.name : '...'})
        </LogoutButton>
      </Header>
      
      <MainContent>
        
        {success && <MessageContainer type="success">{success}</MessageContainer>}
        {error && <MessageContainer type="error">{error}</MessageContainer>}

        <FormContainer>
          <SectionTitle>Visitor Wallet Manager</SectionTitle>
          <Form onSubmit={handleTopUp}>
            
            {/* The manual Event ID input is GONE */}
            
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
            
            {/* --- NEW VISITOR NAME INPUT --- */}
            <InputGroup>
              <Label htmlFor="visitorName">Visitor Name (Optional)</Label>
              <Input 
                id="visitorName"
                type="text" 
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g., Soham"
              />
            </InputGroup>

            {/* --- NEW MEMBER TOGGLE --- */}
            <InputGroup>
              <ToggleLabel>
                <ToggleCheckbox 
                  type="checkbox" 
                  checked={isMember} 
                  onChange={(e) => setIsMember(e.target.checked)} 
                />
                <ToggleSlider checked={isMember} />
                Club Member?
              </ToggleLabel>
            </InputGroup>

            {/* --- NEW CONDITIONAL MEMBERSHIP ID INPUT --- */}
            {isMember && (
              <InputGroup>
                <Label htmlFor="membershipId">Membership ID</Label>
                <Input 
                  id="membershipId"
                  type="text" 
                  value={membershipId}
                  onChange={(e) => setMembershipId(e.target.value)}
                  placeholder="e.g., FATES2025"
                  required={isMember} // Only required if the toggle is on
                />
              </InputGroup>
            )}
            
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
                required // Amount is required for top-up
              />
            </InputGroup>
            
            {/* Updated 'disabled' check */}
            <Button type="submit" disabled={loading || !phone || !amount}>
              {loading ? 'Processing...' : 'Top Up Wallet'}
            </Button>
            
            <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0'}} />
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              {/* Updated 'disabled' check */}
              <CheckBalanceButton 
                type="button" 
                onClick={handleCheckBalance} 
                disabled={loading || !phone}
              >
                Check Balance
              </CheckBalanceButton>
              {/* Updated 'disabled' check */}
              <RefundButton 
                type="button" 
                onClick={handleRefund} 
                disabled={loading || !phone}
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
