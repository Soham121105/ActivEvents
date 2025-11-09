import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'react-qr-code'; 

// --- Styling ---
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
// --- End Styling ---

export default function StallQrPage() {
  // Get the FULL stall object, which now includes url_slug
  const { stall } = useAuth(); 

  if (!stall) {
    return <PageHeader>Loading...</PageHeader>;
  }
  
  // --- THE PERMANENT FIX ---
  // We use the stall's own url_slug from its auth token.
  // This will ALWAYS be correct, regardless of who is logged in.
  const qrUrl = `${window.location.origin}/${stall.url_slug}/v/login?event=${stall.event_id}&stall=${stall.id}`;


  return (
    <div>
      <PageHeader>Visitor QR Code</PageHeader>
      <InfoText>
        Ask customers to scan this QR code. It will take them directly to your
        menu for this specific event.
      </InfoText>
      
      <QrContainer>
        <QRCode value={qrUrl} size={256} />
      </QrContainer>
      
      <InfoText style={{marginTop: '16px', fontSize: '0.875rem', color: '#6b7280'}}>
        <strong>URL:</strong> <a href={qrUrl} target="_blank" rel="noopener noreferrer">{qrUrl}</a>
      </InfoText>
    </div>
  );
}
