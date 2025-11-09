import { useState } from 'react';
import styled from 'styled-components';
// --- CHANGE: Use admin adapter ---
import { adminAxios } from '../utils/apiAdapters';
import { useParams, useNavigate, Link } from 'react-router-dom';

// ... (Keep all styled components exactly the same) ...
const PageHeader = styled.h1`font-size: 2.25rem; font-weight: 800; color: #111827; margin-bottom: 24px;`;
const BackLink = styled(Link)`color: #2563eb; text-decoration: none; font-weight: 500; margin-bottom: 16px; display: inline-block; &:hover { text-decoration: underline; }`;
const Section = styled.div`background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); max-width: 600px;`;
const Form = styled.form`display: grid; grid-template-columns: 1fr; gap: 16px;`;
const InputGroup = styled.div`display: flex; flex-direction: column;`;
const Label = styled.label`font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px;`;
const Input = styled.input`background-color: white; border: 1px solid #d1d5db; color: #111827; padding: 10px 14px; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); }`;
const Button = styled.button`background-color: #2563eb; color: white; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; &:hover { background-color: #1d4ed8; } &:disabled { background-color: #9ca3af; }`;
const ModalBackdrop = styled.div`position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;`;
const ModalContent = styled.div`background-color: white; padding: 24px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; text-align: center;`;
const ModalTitle = styled.h2`font-size: 1.25rem; font-weight: 600; color: #111827; margin-top: 0;`;
const PasswordDisplay = styled.div`background-color: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px; font-size: 1.5rem; font-weight: 700; color: #1d4ed8; margin: 16px 0;`;

export default function AddStallPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [stallName, setStallName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState('0.20'); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newStall, setNewStall] = useState(null);

  const handleAddStall = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // --- CHANGE: Use adminAxios ---
      const response = await adminAxios.post(`/events/${eventId}/stalls`, {
        stall_name: stallName,
        owner_phone: ownerPhone,
        commission_rate: parseFloat(commissionRate),
      });

      setNewStall(response.data);
      setShowModal(true);

    } catch (err) {
      console.error("Error adding stall:", err);
      setError(err.response?.data?.error || "Failed to add stall.");
    } finally {
      setLoading(false);
    }
  };

  const closeAndRedirect = () => {
    setShowModal(false);
    navigate(`/event/${eventId}`);
  };

  return (
    <>
      <BackLink to={`/event/${eventId}`}>&larr; Back to Event Hub</BackLink>
      <PageHeader>Add New Stall</PageHeader>
      <Section>
        <Form onSubmit={handleAddStall}>
          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
          <InputGroup>
            <Label htmlFor="stall_name">Stall Name</Label>
            <Input id="stall_name" type="text" value={stallName} onChange={(e) => setStallName(e.target.value)} placeholder="e.g., Gupta Chaat House" required />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="owner_phone">Stall Owner Phone Number</Label>
            <Input id="owner_phone" type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="9876543210" required />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="commission_rate">Commission Rate (e.g., 0.20 for 20%)</Label>
            <Input id="commission_rate" type="number" step="0.01" min="0" max="1" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} required />
          </InputGroup>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Stall'}</Button>
        </Form>
      </Section>
      {showModal && (
        <ModalBackdrop>
          <ModalContent>
            <ModalTitle>Stall Created Successfully!</ModalTitle>
            <p>Please provide these details to the stall owner.</p>
            <InputGroup style={{textAlign: 'left'}}>
              <Label>Login Phone</Label>
              <PasswordDisplay>{newStall.owner_phone}</PasswordDisplay>
            </InputGroup>
            <InputGroup style={{textAlign: 'left'}}>
              <Label>Temporary Password</Label>
              <PasswordDisplay>{newStall.temp_password}</PasswordDisplay>
            </InputGroup>
            <Button onClick={closeAndRedirect}>Done</Button>
          </ModalContent>
        </ModalBackdrop>
      )}
    </>
  );
}
