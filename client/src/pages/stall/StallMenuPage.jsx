import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { stallAxios } from '../../utils/apiAdapters';

// --- STYLED COMPONENTS ---
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const TitleSection = styled.div``;
const PageTitle = styled.h1`
  font-size: 2rem; font-weight: 800; color: #111827; margin: 0;
`;
const PageSubtitle = styled.p`
  color: #6b7280; margin-top: 8px; font-size: 1rem;
`;

const AddButton = styled.button`
  background-color: #4f46e5; color: white; border: none;
  padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 1rem;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
  &:hover { background-color: #4338ca; transform: translateY(-2px); box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3); }
`;

// --- MENU GRID & CARDS ---
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const MenuCard = styled.div`
  background: white; border-radius: 16px; overflow: hidden;
  border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s; opacity: ${props => props.available ? 1 : 0.6};
  filter: ${props => props.available ? 'none' : 'grayscale(80%)'};
  &:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transform: translateY(-2px); }
`;

const CardImage = styled.div`
  height: 160px; background-color: #f1f5f9;
  background-image: url(${props => props.src});
  background-size: cover; background-position: center;
  position: relative;
`;

const Badge = styled.span`
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
  background-color: ${props => props.type === 'veg' ? '#dcfce7' : props.type === 'non-veg' ? '#fee2e2' : '#dbeafe'};
  color: ${props => props.type === 'veg' ? '#166534' : props.type === 'non-veg' ? '#991b1b' : '#1e40af'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
`;
const ItemName = styled.h3`
  font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3;
`;
const ItemPrice = styled.span`
  font-size: 1.25rem; font-weight: 800; color: #4f46e5;
`;
const ItemDesc = styled.p`
  color: #64748b; font-size: 0.95rem; line-height: 1.5; margin: 0 0 20px 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 20px; border-top: 1px solid #f1f5f9;
`;

// --- FANCY TOGGLE SWITCH ---
const ToggleWrapper = styled.label`
  display: flex; align-items: center; gap: 10px; cursor: pointer;
`;
const ToggleLabel = styled.span`
  font-size: 0.875rem; font-weight: 600;
  color: ${props => props.checked ? '#059669' : '#9ca3af'};
`;
const ToggleSwitch = styled.div`
  position: relative; width: 44px; height: 24px;
  background-color: ${props => props.checked ? '#10b981' : '#e5e7eb'};
  border-radius: 99px; transition: all 0.2s ease-in-out;
  &::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 20px; height: 20px; background-color: white; border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transform: translateX(${props => props.checked ? '20px' : '0'});
    transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
`;

const DeleteButton = styled.button`
  background: none; border: none; color: #94a3b8; font-weight: 600; font-size: 0.9rem; cursor: pointer;
  padding: 8px 12px; border-radius: 8px;
  &:hover { background-color: #fef2f2; color: #ef4444; }
`;

// --- MODAL FOR ADDING ITEMS ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 50;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s;
`;
const Modal = styled.div`
  background: white; width: 100%; max-width: 500px;
  border-radius: 20px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  transform: translateY(${props => props.isOpen ? '0' : '20px'});
  transition: all 0.3s;
`;
const ModalTitle = styled.h2`
  margin-top: 0; font-size: 1.5rem; color: #0f172a;
`;

// --- FORM ELEMENTS ---
const Form = styled.form`display: flex; flex-direction: column; gap: 20px;`;
const FormGroup = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const Label = styled.label`font-size: 0.875rem; font-weight: 700; color: #334155;`;
const Input = styled.input`
  padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 1rem;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px #e0e7ff; }
`;
const Select = styled.select`
  padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 1rem; background-color: white;
`;
const TextArea = styled.textarea`
  padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 1rem; resize: vertical; min-height: 80px;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px #e0e7ff; }
`;
const ButtonGroup = styled.div`display: flex; gap: 12px; margin-top: 12px;`;
const SubmitButton = styled.button`
  flex: 2; background-color: #4f46e5; color: white; padding: 14px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer;
  &:hover { background-color: #4338ca; }
`;
const CancelButton = styled.button`
  flex: 1; background-color: white; color: #475569; padding: 14px; border-radius: 10px; font-weight: 700; border: 1px solid #cbd5e1; cursor: pointer;
  &:hover { background-color: #f8fafc; }
`;


export default function StallMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState('veg');
  const [isSpicy, setIsSpicy] = useState(false);

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    try {
      const res = await stallAxios.get('/menu');
      setMenuItems(res.data);
    } catch (err) { console.error("Failed to load menu"); } 
    finally { setLoading(false); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const newItem = { 
        item_name: itemName, 
        price: parseFloat(price), 
        description, 
        image_url: imageUrl, 
        is_veg: isVeg, 
        is_spicy: isSpicy, 
        allergens: [] 
      };
      const res = await stallAxios.post('/menu', newItem);
      setMenuItems([...menuItems, res.data]);
      closeModal();
    } catch (err) { alert("Failed to add item. Please check all fields."); }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form
    setItemName(''); setPrice(''); setDescription(''); setImageUrl(''); setIsVeg('veg'); setIsSpicy(false);
  };

  const handleToggleStock = async (item) => {
    // Optimistic update for instant UI feedback
    const updatedItems = menuItems.map(i => i.item_id === item.item_id ? {...i, is_available: !i.is_available} : i);
    setMenuItems(updatedItems);
    try { await stallAxios.put(`/menu/${item.item_id}/stock`, { is_available: !item.is_available }); } 
    catch (err) { 
      setMenuItems(menuItems); // Revert on error
      alert("Failed to update stock status."); 
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item permanently?")) return;
    try { 
      await stallAxios.delete(`/menu/${itemId}`); 
      setMenuItems(menuItems.filter(i => i.item_id !== itemId)); 
    } catch (err) { 
      alert("Cannot delete item. It might be part of a past order history."); 
    }
  };

  if (loading) return <p style={{padding: 32}}>Loading menu...</p>;

  return (
    <Container>
      <Header>
        <TitleSection>
          <PageTitle>Menu Management</PageTitle>
          <PageSubtitle>{menuItems.length} items visible to customers</PageSubtitle>
        </TitleSection>
        <AddButton onClick={() => setIsModalOpen(true)}>
          <span style={{fontSize: '1.5rem', lineHeight: 1}}>+</span> Add New Item
        </AddButton>
      </Header>

      <MenuGrid>
        {menuItems.map(item => (
          <MenuCard key={item.item_id} available={item.is_available}>
            <CardImage src={item.image_url || 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image'}>
               <Badge type={item.is_veg}>{item.is_veg}</Badge>
            </CardImage>
            <CardContent>
              <CardHeader>
                <ItemName>
                  {item.item_name} {item.is_spicy && '🌶️'}
                </ItemName>
                <ItemPrice>₹{parseFloat(item.price).toFixed(0)}</ItemPrice>
              </CardHeader>
              <ItemDesc>{item.description || 'No description provided.'}</ItemDesc>
              <CardFooter>
                <ToggleWrapper>
                  <input 
                    type="checkbox" 
                    checked={item.is_available} 
                    onChange={() => handleToggleStock(item)} 
                    style={{display: 'none'}} 
                  />
                  <ToggleSwitch checked={item.is_available} />
                  <ToggleLabel checked={item.is_available}>
                    {item.is_available ? 'IN STOCK' : 'SOLD OUT'}
                  </ToggleLabel>
                </ToggleWrapper>
                <DeleteButton onClick={() => handleDelete(item.item_id)}>Delete</DeleteButton>
              </CardFooter>
            </CardContent>
          </MenuCard>
        ))}
      </MenuGrid>

      {/* --- ADD ITEM MODAL --- */}
      <ModalOverlay isOpen={isModalOpen} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <Modal isOpen={isModalOpen}>
          <ModalTitle>Add New Menu Item</ModalTitle>
          <Form onSubmit={handleAddItem}>
            <FormGroup>
              <Label>Item Name *</Label>
              <Input required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Chicken Tikka" autoFocus />
            </FormGroup>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <FormGroup>
                <Label>Price (₹) *</Label>
                <Input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="200" />
              </FormGroup>
               <FormGroup>
                <Label>Type</Label>
                <Select value={isVeg} onChange={e => setIsVeg(e.target.value)}>
                  <option value="veg">Veg 🌱</option>
                  <option value="non-veg">Non-Veg 🍖</option>
                  <option value="vegan">Vegan 🌿</option>
                  <option value="jain">Jain (No Onion/Garlic)</option>
                </Select>
              </FormGroup>
            </div>
            <FormGroup>
              <Label>Description</Label>
              <TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short, appealing description..." />
            </FormGroup>
            <FormGroup>
              <Label>Image URL</Label>
              <Input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
            </FormGroup>
            <label style={{display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: '#334155', cursor: 'pointer'}}>
              <input type="checkbox" checked={isSpicy} onChange={e => setIsSpicy(e.target.checked)} style={{width: 20, height: 20, accentColor: '#ef4444'}} />
              <span>Is this item Spicy? 🌶️</span>
            </label>
            <ButtonGroup>
              <CancelButton type="button" onClick={closeModal}>Cancel</CancelButton>
              <SubmitButton type="submit">Save Item</SubmitButton>
            </ButtonGroup>
          </Form>
        </Modal>
      </ModalOverlay>

    </Container>
  );
}
