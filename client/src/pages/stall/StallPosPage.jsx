import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// --- Styling ---
const PageHeader = styled.h1`
  font-size: 2.25rem; font-weight: 800; color: #111827;
  margin-top: 0; margin-bottom: 24px;
`;
const PosLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  height: calc(100vh - 120px); /* Full height minus padding */
`;
const Column = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const ColumnHeader = styled.h2`
  font-size: 1.5rem; font-weight: 600; color: #111827;
  margin: 0; padding: 24px;
  border-bottom: 1px solid #e5e7eb;
`;
const ContentArea = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  padding: 16px;
`;

// --- Live Order (KDS) Styling ---
const OrderCard = styled.div`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`;
const OrderHeader = styled.div`
  padding: 16px; border-bottom: 1px solid #e5e7eb;
`;
const CustomerName = styled.h3`
  font-size: 1.25rem; font-weight: 700; color: #111827;
  margin: 0 0 4px 0;
`;
const CustomerInfo = styled.span`
  font-size: 0.875rem; color: #6b7280;
`;
const MemberTag = styled.span`
  background-color: #fdf2e9; color: #ea580c;
  padding: 2px 8px; border-radius: 6px;
  font-weight: 600; margin-left: 8px;
`;
const ItemList = styled.ul`
  list-style: none; padding: 16px; margin: 0;
`;
const Item = styled.li`
  font-size: 1.125rem; color: #374151;
  & > span { font-weight: 700; color: #111827; margin-right: 8px; }
`;
const CompleteButton = styled.button`
  background-color: #22c55e; color: white;
  font-weight: 600; padding: 16px;
  border-radius: 0 0 11px 11px;
  border: none; cursor: pointer; font-size: 1.125rem;
  &:hover { background-color: #16a34a; }
`;

// --- Quick POS Menu Styling ---
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
`;
const MenuItem = styled.button`
  background-color: white;
  border: 1px solid ${props => props.outOfStock ? '#fca5a5' : '#e5e7eb'};
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  cursor: ${props => props.outOfStock ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  opacity: ${props => props.outOfStock ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    border-color: #7c3aed;
    box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05);
  }
`;
const ItemName = styled.h3`
  font-size: 1.125rem; font-weight: 600; color: #111827;
  margin: 0 0 4px 0;
`;
const ItemPrice = styled.span`
  font-size: 1rem; font-weight: 500; color: #6b7280;
`;

export default function StallPosPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // State for KDS (Live Orders)
  const [liveOrders, setLiveOrders] = useState([]);
  const [kdsError, setKdsError] = useState(null);
  
  // State for POS (Menu)
  const [menu, setMenu] = useState([]);
  const [posError, setPosError] = useState(null);

  // Universal logout function for API errors
  const handleApiError = (err, errorSetter) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      logout();
      navigate('/stall-login');
    } else {
      errorSetter("Failed to fetch data.");
    }
  };

  // --- 1. KDS (LIVE ORDERS) LOGIC ---
  useEffect(() => {
    const fetchLiveOrders = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/orders/live');
        setLiveOrders(response.data);
        setKdsError(null);
      } catch (err) {
        console.error("KDS Error:", err);
        handleApiError(err, setKdsError);
      }
    };
    
    fetchLiveOrders(); // Fetch on load
    const pollInterval = setInterval(fetchLiveOrders, 5000); // Poll every 5 sec
    return () => clearInterval(pollInterval);
  }, [logout, navigate]);

  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.post(`http://localhost:3001/api/orders/${orderId}/complete`);
      setLiveOrders((prev) => prev.filter(o => o.order_id !== orderId));
    } catch (err) {
      handleApiError(err, () => alert("Failed to complete order."));
    }
  };

  // --- 2. POS (MENU) LOGIC ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/menu');
        setMenu(res.data);
        setPosError(null);
      } catch (err) {
        console.error("POS Menu Error:", err);
        handleApiError(err, setPosError);
      }
    };
    fetchMenu();
  }, [logout, navigate]);

  const handlePosOrder = () => {
    // We will build the cart logic for this in the next step
    // For now, this just shows the menu
    alert("Manual POS checkout coming soon!");
  };

  return (
    <>
      <PageHeader>Point of Sale</PageHeader>
      <PosLayout>
        {/* --- LEFT COLUMN: LIVE VISITOR ORDERS (KDS) --- */}
        <Column>
          <ColumnHeader>Live Visitor Orders</ColumnHeader>
          <ContentArea>
            {kdsError && <p style={{color: 'red'}}>{kdsError}</p>}
            {liveOrders.length === 0 && !kdsError && (
              <p style={{padding: '0 8px', color: '#6b7280'}}>No pending visitor orders. New orders will appear here.</p>
            )}
            {liveOrders.map((order) => (
              <OrderCard key={order.order_id}>
                <OrderHeader>
                  <CustomerName>{order.customer_display_name}</CustomerName>
                  <CustomerInfo>
                    {order.visitor_phone}
                    {order.membership_id && (
                      <MemberTag>Member: {order.membership_id}</MemberTag>
                    )}
                  </CustomerInfo>
                </OrderHeader>
                <ItemList>
                  {order.items.map((item, index) => (
                    <Item key={index}>
                      <span>{item.quantity}x</span> {item.item_name}
                    </Item>
                  ))}
                </ItemList>
                <CompleteButton onClick={() => handleCompleteOrder(order.order_id)}>
                  Mark as Completed
                </CompleteButton>
              </OrderCard>
            ))}
          </ContentArea>
        </Column>

        {/* --- RIGHT COLUMN: QUICK POS (Manual Orders) --- */}
        <Column>
          <ColumnHeader>Manual Order</ColumnHeader>
          <ContentArea>
            {posError && <p style={{color: 'red'}}>{posError}</p>}
            <MenuGrid>
              {menu.map(item => (
                <MenuItem 
                  key={item.item_id} 
                  onClick={handlePosOrder} // We will build a cart for this
                  disabled={!item.is_available}
                  outOfStock={!item.is_available}
                >
                  <ItemName>{item.item_name}</ItemName>
                  <ItemPrice>{item.is_available ? `₹${parseFloat(item.price).toFixed(2)}` : 'Sold Out'}</ItemPrice>
                </MenuItem>
              ))}
            </MenuGrid>
          </ContentArea>
          {/* We will add the Cart & Checkout button here */}
        </Column>
      </PosLayout>
    </>
  );
}