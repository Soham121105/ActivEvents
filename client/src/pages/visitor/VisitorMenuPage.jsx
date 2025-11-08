import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useVisitorAuth } from '../../context/VisitorAuthContext';

// --- Styling ---
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
`;
const Header = styled.header`
  background-color: #7c3aed;
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;
const StallName = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;
const Balance = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
`;
const MainContent = styled.main`
  padding: 24px;
`;
const MenuList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;
const MenuItem = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
`;
const ItemName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;
const ItemPrice = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
`;
const AddButton = styled.button`
  background-color: #eef2ff;
  color: #4338ca;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: #e0e7ff; }
`;
const CartFooter = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 16px 24px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const TotalPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
`;
const PayButton = styled.button`
  background-color: #16a34a;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  transition: background-color 0.2s;
  &:hover { background-color: #15803d; }
  &:disabled { background-color: #9ca3af; }
`;
const ErrorMessage = styled.p`
  color: #ef4444;
  font-weight: 600;
  text-align: center;
`;
// --- End of Styling ---

// --- Private Route Hook (specific to this page) ---
const useVisitorPrivateRoute = () => {
  const { token } = useVisitorAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      // If not logged in, redirect to login, but keep the URL params
      const params = new URLSearchParams(window.location.search);
      navigate(`/v/login?${params.toString()}`);
    }
  }, [token, navigate]);
};

export default function VisitorMenuPage() {
  useVisitorPrivateRoute(); // Secure this page
  
  const { stall_id } = useParams();
  const { wallet, updateBalance } = useVisitorAuth();
  
  const [stallName, setStallName] = useState('Loading...');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({}); // e.g., { item_id: quantity, ... }
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Menu on load
  useEffect(() => {
    axios.get(`http://localhost:3001/api/visitor/stall/${stall_id}/menu`)
      .then(res => {
        setStallName(res.data.stall_name);
        setMenuItems(res.data.menu_items);
      })
      .catch(err => {
        setError("Could not load menu.");
      });
  }, [stall_id]);

  const addToCart = (item) => {
    setCart(prevCart => ({
      ...prevCart,
      [item.item_id]: (prevCart[item.item_id] || 0) + 1
    }));
  };

  const calculateTotal = () => {
    return Object.keys(cart).reduce((total, itemId) => {
      const item = menuItems.find(m => m.item_id === itemId);
      return total + (item.price * cart[itemId]);
    }, 0);
  };

  const total = calculateTotal();

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    
    // Format cart for the API
    const itemsToPay = Object.keys(cart).map(itemId => ({
      item_id: itemId,
      quantity: cart[itemId]
    }));
    
    try {
      const response = await axios.post(`http://localhost:3001/api/visitor/stall/${stall_id}/pay`, {
        items: itemsToPay
      });
      
      // Payment success!
      updateBalance(response.data.new_balance); // Update global balance
      alert(`Success! Your order #${response.data.orderId.substring(0, 5)} is confirmed.`);
      setCart({}); // Clear the cart
      setLoading(false);
      
    } catch (err) {
      console.error("Payment failed:", err);
      setError(err.response?.data?.error || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Header>
        <StallName>{stallName}</StallName>
        <Balance>Balance: ₹{wallet ? parseFloat(wallet.current_balance).toFixed(2) : '0.00'}</Balance>
      </Header>
      
      <MainContent>
        {menuItems.map(item => (
          <MenuItem key={item.item_id}>
            <ItemDetails>
              <ItemName>{item.item_name}</ItemName>
              <ItemPrice>₹{parseFloat(item.price).toFixed(2)}</ItemPrice>
            </ItemDetails>
            <AddButton onClick={() => addToCart(item)}>
              Add {cart[item.item_id] > 0 && `(${cart[item.item_id]})`}
            </AddButton>
          </MenuItem>
        ))}
      </MainContent>
      
      {total > 0 && (
        <CartFooter>
          <TotalPrice>Total: ₹{total.toFixed(2)}</TotalPrice>
          <PayButton onClick={handlePay} disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </PayButton>
        </CartFooter>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </PageContainer>
  );
}
