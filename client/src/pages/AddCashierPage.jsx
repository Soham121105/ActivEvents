import { useState } from 'react';
import styled from 'styled-components';
// --- CHANGE: REMOVE standard axios ---
// import axios from 'axios'; 
// --- CHANGE: ADD specific admin adapter ---
import { adminAxios } from '../utils/apiAdapters';
import { useParams, useNavigate, Link } from 'react-router-dom';

// --- Reusable Styling ---
const PageHeader = styled.h1` font-size: 2.25rem; font-weight: 800; color: #111827; margin-bottom: 24px; `;
const BackLink = styled(Link)` color: #2563eb; text-decoration: none; font-weight: 500; margin-bottom: 16px; display: inline-block; &:hover { text-decoration: underline; } `;
const Section = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); max-width: 600px; `;
const Form = styled.form` display: grid; grid-template-columns: 1fr; gap: 16px; `;
const InputGroup = styled.div` display: flex; flex-direction: column; `;
const Label = styled.label` font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px; `;
const Input = styled.input` background-color: white; border: 1px solid #d1d5db; color: #111827; padding: 10px 14px; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); } `;
const Button = styled.button` background-color: #2563eb; color: white; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; &:hover { background-color: #1d4ed8; } &:disabled { background-color: #9ca3af; } `;
const ModalBackdrop = styled.div` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; `;
const ModalContent = styled.div` background-color: white; padding: 24px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; text-align: center; `;
const ModalTitle = styled.h2` font-size: 1.25rem; font-weight: 600; color: #111827; margin-top: 0; `;
const PinDisplay = styled.div` background-color: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 8px; padding: 16px; font-size: 2.25rem; font-weight: 700; letter-spacing: 0.1em; color: #7c3aed; margin: 16px 0; `;

export default function AddCashierPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [cashierName, setCashierName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newCashier, setNewCashier] = useState(null);

  const handleAddCashier = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // --- CHANGE: Use adminAxios instead of axios ---
      const response = await adminAxios.post(`/events/${eventId}/cashiers`, {
        cashier_name: cashierName,
      });

      setNewCashier(response.data);
      setShowModal(true);

    } catch (err) {
      console.error("Error adding cashier:", err);
      setError(err.response?.data?.error || "Failed to add cashier.");
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
      <PageHeader>Add New Cashier</PageHeader>
      <Section>
        <Form onSubmit={handleAddCashier}>
          {error && <p style={{ color: 'red', fontSize: '0.875rem' }}>{error}</p>}
          <InputGroup>
            <Label htmlFor="cashier_name">Cashier Name</Label>
            <Input id="cashier_name" type="text" value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="e.g., Main Counter" required />
          </InputGroup>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Cashier'}</Button>
        </Form>
      </Section>
      {showModal && (
        <ModalBackdrop>
          <ModalContent>
            <ModalTitle>Cashier Created Successfully!</ModalTitle>
            <p>Please provide these login details to the cashier. This PIN cannot be recovered.</p>
            <InputGroup style={{textAlign: 'left'}}>
              <Label>Login Name</Label>
              <PinDisplay style={{fontSize: '1.25rem', color: '#1f2937'}}>{newCashier.cashier_name}</PinDisplay>
            </InputGroup>
            <InputGroup style={{textAlign: 'left'}}>
              <Label>Temporary 4-Digit PIN</Label>
              <PinDisplay>{newCashier.temp_pin}</PinDisplay>
            </InputGroup>
            <Button onClick={closeAndRedirect}>Done</Button>
          </ModalContent>
        </ModalBackdrop>
      )}
    </>
  );
}
