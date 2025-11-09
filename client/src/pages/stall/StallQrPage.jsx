import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'react-qr-code'; // --- NEW: Import the library ---

// --- NEW: Styling ---
const PageHeader = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-top: 0;
  margin-bottom: 24px;
`;

const QrContainer = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  display: inline-block; /* Fit content */
`;

const InfoText = styled.p`
  font-size: 1.125rem;
  color: #374151;
  max-width: 500px;
  line-height: 1.6;
`;

export default function StallQrPage() {
  // --- NEW: Get stall info from auth ---
  const { stall } = useAuth();
  
  if (!stall) {
    return <PageHeader>Loading...</PageHeader>;
  }

  // 1. Construct the URL for the visitor app
  // This URL will open the visitor login page,
  // pre-filled with this stall's event_id and stall_id.
  const qrUrl = `${window.location.origin}/v/login?event=${stall.event_id}&stall=${stall.id}`;


  return (
    <div>
      <PageHeader>Visitor QR Code</PageHeader>
      <InfoText>
        Ask customers to scan this QR code with their phone. It will take them
        to your menu where they can log in and pay with their wallet.
      </InfoText>
      
      {/* --- NEW: Render the QR Code --- */}
      <QrContainer>
        <QRCode value={qrUrl} size={256} />
      </QrContainer>
      
      <InfoText style={{marginTop: '16px', fontSize: '0.875rem', color: '#6b7280'}}>
        <strong>Stall:</strong> {stall.name} <br />
        <strong>Event ID:</strong> {stall.event_id} <br />
        <strong>Your URL:</strong> <a href={qrUrl} target="_blank" rel="noopener noreferrer">{qrUrl}</a>
      </InfoText>
    </div>
  );
}
