import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { visitorAxios } from '../../utils/apiAdapters';
import { useParams, useNavigate } from 'react-router-dom';
import { useVisitorAuth } from '../../context/VisitorAuthContext';

// --- STYLED COMPONENTS ---
const Container = styled.div`
  padding: 20px; padding-bottom: 100px;
`;
const StallHeader = styled.div`
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
  background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
`;
const StallLogo = styled.img`
  width: 64px; height: 64px; border-radius: 12px; object-fit: cover; background-color: #f1f5f9;
`;
const StallInfo = styled.div` flex: 1; `;
const StallName = styled.h2` font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; `;
const StallDesc = styled.p` font-size: 0.9rem; color: #64748b; margin: 4px 0 0 0; line-height: 1.4; `;

const MenuList = styled.div` display: grid; gap: 16px; `;
const MenuItem = styled.div`
  background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  display: grid; grid-template-columns: 100px 1fr;
`;
const ItemImage = styled.div`
  background-image: url(${props => props.src}); background-size: cover; background-position: center;
  background-color: #f1f5f9;
`;
const ItemContent = styled.div` padding: 16px; display: flex; flex-direction: column; `;
const ItemHeader = styled.div` display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; `;
const ItemTitle = styled.h3` font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; `;
const ItemPrice = styled.span` font-size: 1rem; font-weight: 800; color: #0f172a; `;
const ItemDesc = styled.p` font-size: 0.85rem; color: #64748b; margin: 0 0 12px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`;
const ItemFooter = styled.div` display: flex; justify-content: space-between; align-items: center; margin-top: auto; `;
const Badge = styled.span`
  padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  background-color: ${props => props.type === 'veg' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.type === 'veg' ? '#166534' : '#991b1b'};
`;
const AddButton = styled.button`
  background-color: #e0e7ff; color: #4338ca; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
  &:active { transform: scale(0.95); }
`;
const QtyControl = styled.div`
  display: flex; align-items: center; gap: 12px; background-color: #f1f5f9; padding: 4px; border-radius: 8px;
`;
const QtyBtn = styled.button`
  width: 28px; height: 28px; border-radius: 6px; border: none; background: white; color: #0f172a; font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  &:active { background: #e2e8f0; }
`;
const QtyVal = styled.span` font-weight: 700; color: #0f172a; min-width: 20px; text-align: center; `;

const slideUp = keyframes`from { transform: translateY(100%); } to { transform: translateY(0); }`;
const CartBar = styled.div`
  position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 16px 20px;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.1); animation: ${slideUp} 0.3s ease-out; z-index: 20;
  display: flex; justify-content: space-between; align-items: center;
`;
const CartInfo = styled.div``;
const ItemCount = styled.div` font-size: 0.9rem; color: #64748b; font-weight: 600; `;
const CartTotal = styled.div` font-size: 1.25rem; font-weight: 800; color: #0f172a; `;
const PayButton = styled.button`
  background-color: #16a34a; color: white; border: none; padding: 14px 32px; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  &:hover { background-color: #15803d; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3); }
  &:active { transform: translateY(0); }
  &:disabled { background-color: #9ca3af; cursor: not-allowed; transform: none; box-shadow: none; }
`;

export default function VisitorMenuPage() {
  const { stall_id } = useParams();
  const { updateBalance } = useVisitorAuth();
  const [stall, setStall] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    visitorAxios.get(`/visitor/stall/${stall_id}/menu`)
      .then(res => { setStall(res.data.stall); setMenu(res.data.menu_items); })
      .catch(err => console.error("Menu load failed", err));
  }, [stall_id]);

  const updateCart = (itemId, delta) => {
    setCart(prev => {
      const newQty = (prev[itemId] || 0) + delta;
      if (newQty <= 0) { const { [itemId]: _, ...rest } = prev; return rest; }
      return { ...prev, [itemId]: newQty };
    });
  };

  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + (menu.find(i => i.item_id === id)?.price || 0) * qty, 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handlePay = async () => {
    if (!window.confirm(`Confirm payment of ₹${total.toFixed(0)}?`)) return;
    setLoading(true);
    try {
      const res = await visitorAxios.post(`/visitor/stall/${stall_id}/pay`, {
        items: Object.entries(cart).map(([id, qty]) => ({ item_id: id, quantity: qty }))
      });
      updateBalance(res.data.new_balance);
      alert(`Order #${res.data.orderId.slice(0, 5)} confirmed!`);
      setCart({});
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed.");
    } finally { setLoading(false); }
  };

  if (!stall) return <p style={{padding: 20}}>Loading menu...</p>;

  return (
    <Container>
      <StallHeader>
        {stall.logo_url ? <StallLogo src={stall.logo_url} /> : <div style={{width:64, height:64, background:'#e2e8f0', borderRadius:12}} />}
        <StallInfo>
          <StallName>{stall.stall_name}</StallName>
          <StallDesc>{stall.description || 'Welcome to our stall!'}</StallDesc>
        </StallInfo>
      </StallHeader>

      <MenuList>
        {menu.map(item => (
          <MenuItem key={item.item_id}>
            <ItemImage src={item.image_url || 'https://placehold.co/200x200/e2e8f0/94a3b8?text=No+Image'} />
            <ItemContent>
              <ItemHeader>
                <ItemTitle>{item.item_name}</ItemTitle>
                <ItemPrice>₹{parseFloat(item.price).toFixed(0)}</ItemPrice>
              </ItemHeader>
              <ItemDesc>{item.description}</ItemDesc>
              <ItemFooter>
                <Badge type={item.is_veg}>{item.is_veg}</Badge>
                {cart[item.item_id] ? (
                  <QtyControl>
                    <QtyBtn onClick={() => updateCart(item.item_id, -1)}>−</QtyBtn>
                    <QtyVal>{cart[item.item_id]}</QtyVal>
                    <QtyBtn onClick={() => updateCart(item.item_id, 1)}>+</QtyBtn>
                  </QtyControl>
                ) : (
                  <AddButton onClick={() => updateCart(item.item_id, 1)}>ADD +</AddButton>
                )}
              </ItemFooter>
            </ItemContent>
          </MenuItem>
        ))}
      </MenuList>

      {itemCount > 0 && (
        <CartBar>
          <CartInfo>
            <ItemCount>{itemCount} Items</ItemCount>
            <CartTotal>₹{total.toFixed(0)}</CartTotal>
          </CartInfo>
          <PayButton onClick={handlePay} disabled={loading}>
            {loading ? 'Paying...' : `PAY ₹${total.toFixed(0)}`}
          </PayButton>
        </CartBar>
      )}
    </Container>
  );
}
