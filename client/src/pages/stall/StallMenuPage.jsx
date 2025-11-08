import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios'; // We use axios, which is auto-configured by our AuthContext

// --- Styling ---
const PageHeader = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-top: 0;
  margin-bottom: 24px;
`;
const LoadingText = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
`;
const ErrorMessage = styled.p`
  font-size: 0.875rem;
  color: #ef4444;
`;
const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
`;
const Section = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
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
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;
const Select = styled.select`
  background-color: white;
  border: 1px solid #d1d5db;
  color: #111827;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;
const Button = styled.button`
  background-color: #2563eb;
  color: white;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  &:hover {
    background-color: #1d4ed8;
  }
`;
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

// --- UPDATED: Added a 4th column for the Remove button ---
const ListItem = styled.li`
  display: grid;
  /* Name, Price, Toggle, Remove */
  grid-template-columns: 1fr auto auto auto; 
  align-items: center;
  gap: 24px; /* Increased gap */
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
  &:last-child {
    border-bottom: none;
  }
`;
const ItemName = styled.span`
  font-weight: 600;
  color: #1f2937;
`;
const ItemPrice = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
`;
const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
`;
const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  &:checked + span {
    background-color: #22c55e;
  }
  &:checked + span:before {
    transform: translateX(22px);
  }
`;
const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 28px;
  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

// --- NEW: Styling for the "Remove" button ---
const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af; /* gray-400 */
  cursor: pointer;
  font-weight: 700;
  font-size: 1.25rem; /* Makes the '×' bigger */
  padding: 0 4px;
  line-height: 1;
  &:hover {
    color: #ef4444; /* red-500 */
  }
`;
// --- End of Styling ---

// --- The Page Component (Updated) ---
export default function StallMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState('veg');
  const [isSpicy, setIsSpicy] = useState(false);
  const [allergens, setAllergens] = useState('');

  const fetchMenu = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/menu');
      setMenuItems(response.data); 
    } catch (err) {
      console.error("Error fetching menu:", err);
      setError("Failed to fetch menu. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const newItem = {
        item_name: itemName,
        price: parseFloat(price),
        is_veg: isVeg,
        is_spicy: isSpicy,
        allergens: allergens.split(',').map(s => s.trim()).filter(Boolean),
      };
      const response = await axios.post('http://localhost:3001/api/menu', newItem); 
      setMenuItems([...menuItems, response.data]);
      setItemName('');
      setPrice('');
      setIsVeg('veg');
      setIsSpicy(false);
      setAllergens('');
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Check all fields.");
    }
  };
  
  const handleStockToggle = async (item) => {
    const newItem = { ...item, is_available: !item.is_available };
    setMenuItems(menuItems.map(i => (i.item_id === item.item_id ? newItem : i)));
    try {
      await axios.put(`http://localhost:3001/api/menu/${item.item_id}/stock`, {
        is_available: newItem.is_available,
      });
    } catch (err) {
      console.error("Error updating stock:", err);
      setError("Failed to update stock. Reverting change.");
      setMenuItems(menuItems.map(i => (i.item_id === item.item_id ? item : i)));
    }
  };

  // --- NEW: "Delete Item" handler ---
  const handleDeleteItem = async (itemId) => {
    // 1. Confirm with the user
    if (!window.confirm("Are you sure you want to permanently delete this item?")) {
      return; // Do nothing if they click cancel
    }
    
    try {
      // 2. Call the new DELETE API
      await axios.delete(`http://localhost:3001/api/menu/${itemId}`);
      
      // 3. Update the UI state by removing the item
      setMenuItems(menuItems.filter(item => item.item_id !== itemId));

    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item. Please try again.");
    }
  };


  if (loading) {
    return <LoadingText>Loading your menu...</LoadingText>;
  }

  return (
    <> 
      <PageHeader>Manage Menu</PageHeader>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <PageLayout>
        <Section>
          <SectionTitle>Your Menu Items</SectionTitle>
          <List>
            {menuItems.length === 0 ? (
              <p>No menu items found. Add one to get started!</p>
            ) : (
              menuItems.map((item) => (
                <ListItem key={item.item_id}>
                  <ItemName>{item.item_name}</ItemName>
                  
                  {/* --- THIS IS THE CRASH FIX ---
                    We convert the 'price' (a string) to a Number
                    before calling .toFixed()
                  */}
                  <ItemPrice>₹{parseFloat(item.price).toFixed(2)}</ItemPrice>
                  
                  <ToggleLabel>
                    <ToggleInput 
                      type="checkbox" 
                      checked={item.is_available}
                      onChange={() => handleStockToggle(item)}
                    />
                    <ToggleSlider />
                  </ToggleLabel>
                  
                  {/* --- THIS IS THE NEW "REMOVE" BUTTON --- */}
                  <RemoveButton 
                    title="Delete item"
                    onClick={() => handleDeleteItem(item.item_id)}
                  >
                    &times; {/* This is a "times" (X) symbol */}
                  </RemoveButton>

                </ListItem>
              ))
            )}
          </List>
        </Section>
        
        <Section>
          <SectionTitle>Add New Item</SectionTitle>
          <Form onSubmit={handleAddItem}>
            <InputGroup>
              <Label htmlFor="itemName">Item Name</Label>
              <Input 
                id="itemName"
                type="text" 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Paneer Wrap"
                required
              />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="price">Price (₹)</Label>
              <Input 
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="100"
                required
              />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="isVeg">Food Type</Label>
              <Select id="isVeg" value={isVeg} onChange={(e) => setIsVeg(e.target.value)}>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
                <option value="vegan">Vegan</option>
                <option value="jain">Jain</option>
              </Select>
            </InputGroup>
            <InputGroup>
              <Label htmlFor="allergens">Allergens (comma-separated)</Label>
              <Input 
                id="allergens"
                type="text" 
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="e.g., nuts, dairy, gluten"
              />
            </InputGroup>
            <InputGroup>
              <Label style={{ display: 'flex', alignItems: 'center' }}>
                <Input 
                  type="checkbox" 
                  checked={isSpicy}
                  onChange={(e) => setIsSpicy(e.target.checked)}
                  style={{ width: 'auto', marginRight: '8px' }}
                />
                Is this item spicy?
              </Label>
            </InputGroup>
            
            <Button type="submit">Add Item to Menu</Button>
          </Form>
        </Section>
      </PageLayout>
    </>
  );
}
