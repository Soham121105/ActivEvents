import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { stallAxios } from '../../utils/apiAdapters';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';

let socket; // Singleton socket instance

// --- MODERN KDS STYLING ---
const Container = styled.div`
  height: calc(100vh - 64px);
  display: flex; flex-direction: column;
`;

const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px;
`;

const TitleGroup = styled.div`
  display: flex; align-items: center; gap: 16px;
`;
const Title = styled.h1`
  font-size: 2.25rem; font-weight: 800; color: #111827; margin: 0;
`;
const LiveBadge = styled.div`
  display: flex; align-items: center; gap: 8px; padding: 6px 12px;
  background-color: #dcfce7; color: #166534; border-radius: 99px; font-weight: 700; font-size: 0.875rem;
`;
const Pulse = styled.span`
  width: 10px; height: 10px; background-color: #22c55e; border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: pulse 1.5s infinite;
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }
`;

const OrderCount = styled.div`
  font-size: 1.5rem; font-weight: 700; color: #4b5563;
  span { color: #4f46e5; }
`;

const TicketGrid = styled.main`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px; align-items: start; overflow-y: auto; padding-bottom: 48px;
`;

const slideUp = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;

const Ticket = styled.article`
  background: white; border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  border: 2px solid ${props => props.isNew ? '#6366f1' : '#e5e7eb'};
  animation: ${slideUp} 0.4s ease-out;
  transition: all 0.3s;
`;

const TicketHead = styled.div`
  background-color: ${props => props.isNew ? '#e0e7ff' : '#f8fafc'};
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
`;
const TicketId = styled.span`
  font-family: 'Monaco', monospace; font-weight: 700; font-size: 1.2rem; color: #1e293b;
`;
const TicketTime = styled.span`
  color: #64748b; font-weight: 600; font-size: 0.9rem;
`;

const CustomerSection = styled.div`
  padding: 12px 20px; background: #fff; border-bottom: 1px solid #f1f5f9;
  display: flex; align-items: center; gap: 10px; font-weight: 600; color: #334155;
`;
const MemberBadge = styled.span`
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  color: #7c2d12; font-size: 0.7rem; padding: 3px 8px; border-radius: 12px; font-weight: 800;
`;

const ItemList = styled.ul`
  list-style: none; padding: 0; margin: 0;
`;
const Item = styled.li`
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
  display: flex; align-items: center; gap: 16px; font-size: 1.15rem; color: #0f172a;
`;
const QtyBadge = styled.span`
  background-color: #f1f5f9; color: #0f172a; font-weight: 800; font-size: 1.2rem;
  min-width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
`;

const ActionSection = styled.div`
  padding: 16px 20px; background-color: #f8fafc;
`;
const CompleteBtn = styled.button`
  width: 100%; padding: 16px; border: none; border-radius: 12px;
  background-color: #22c55e; color: white; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.05em;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);
  &:hover { background-color: #16a34a; transform: translateY(-2px); box-shadow: 0 6px 8px -1px rgba(34, 197, 94, 0.3); }
  &:active { transform: translateY(0); }
`;

export default function StallPosPage() {
  const { stall } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Sound effect for new orders
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  useEffect(() => {
    fetchLiveOrders();

    if (!socket) socket = io('http://localhost:3001');

    if (stall?.id) {
      socket.emit('join_stall_room', stall.id);

      socket.on('new_order', (newOrder) => {
        audioRef.current.play().catch(() => {}); // Try to play sound
        setOrders(prev => [{ ...newOrder, isNew: true }, ...prev]);
        // Remove 'new' highlight after 10s
        setTimeout(() => {
          setOrders(current => current.map(o => o.order_id === newOrder.order_id ? { ...o, isNew: false } : o));
        }, 10000);
      });

      socket.on('remove_order', (orderId) => {
        setOrders(prev => prev.filter(o => o.order_id !== orderId));
      });
    }

    return () => {
      if (socket) { socket.off('new_order'); socket.off('remove_order'); }
    };
  }, [stall?.id]);

  const fetchLiveOrders = async () => {
    try {
      const res = await stallAxios.get('/orders/live');
      setOrders(res.data);
    } catch (err) { console.error("KDS Error:", err); } 
    finally { setLoading(false); }
  };

  const handleComplete = async (orderId) => {
    setOrders(prev => prev.filter(o => o.order_id !== orderId)); // Optimistic UI
    try { await stallAxios.post(`/orders/${orderId}/complete`); } 
    catch (err) { fetchLiveOrders(); alert("Connection error. Order not completed."); }
  };

  if (loading) return <h1>Starting Kitchen Display...</h1>;

  return (
    <Container>
      <Header>
        <TitleGroup>
          <Title>Kitchen Display</Title>
          <LiveBadge><Pulse /> LIVE</LiveBadge>
        </TitleGroup>
        <OrderCount><span>{orders.length}</span> Active Tickets</OrderCount>
      </Header>

      {orders.length === 0 ? (
        <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9ca3af', opacity: 0.7}}>
           <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
           <h2 style={{fontWeight: 500, marginTop: 16}}>All tickets cleared! Waiting for new orders...</h2>
        </div>
      ) : (
        <TicketGrid>
          {orders.map(order => (
            <Ticket key={order.order_id} isNew={order.isNew}>
              <TicketHead isNew={order.isNew}>
                <TicketId>#{order.order_id.slice(0, 5).toUpperCase()}</TicketId>
                <TicketTime>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TicketTime>
              </TicketHead>
              <CustomerSection>
                <span>👤 {order.customer_display_name}</span>
                {order.membership_id && <MemberBadge>CLUB MEMBER</MemberBadge>}
              </CustomerSection>
              <ItemList>
                {order.items.map((item, i) => (
                  <Item key={i}>
                    <QtyBadge>{item.quantity}</QtyBadge>
                    <span>{item.item_name}</span>
                  </Item>
                ))}
              </ItemList>
              <ActionSection>
                <CompleteBtn onClick={() => handleComplete(order.order_id)}>ORDER READY</CompleteBtn>
              </ActionSection>
            </Ticket>
          ))}
        </TicketGrid>
      )}
    </Container>
  );
}
