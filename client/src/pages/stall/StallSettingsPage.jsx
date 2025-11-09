import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { stallAxios } from '../../utils/apiAdapters';
import { useAuth } from '../../context/AuthContext';

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const PageHeader = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
`;

const PageSubheader = styled.p`
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 32px;
`;

const Section = styled.div`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 32px;
`;

const FormGrid = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.95rem;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 120px;
  font-family: inherit;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
`;

const HelperText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 4px 0 0 0;
`;

const SaveButton = styled.button`
  background-color: #4f46e5;
  color: white;
  font-weight: 600;
  padding: 14px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  align-self: start;
  &:hover { background-color: #4338ca; }
  &:disabled { background-color: #9ca3af; cursor: not-allowed; }
`;

const ImagePreview = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
`;

export default function StallSettingsPage() {
  const { stall, login } = useAuth(); // Get 'login' to update context after save
  const [logoUrl, setLogoUrl] = useState(stall?.logo_url || '');
  const [description, setDescription] = useState(stall?.description || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await stallAxios.put('/stalls/me', {
        logo_url: logoUrl,
        description: description,
      });
      
      // Update local context with new data merging with old data
      const updatedStallData = { ...stall, ...res.data };
      // We need the token to call 'login' again to update the context
      const currentToken = localStorage.getItem('stall_token');
      login(updatedStallData, currentToken);

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>Stall Settings</PageHeader>
      <PageSubheader>Customize how your stall appears to visitors.</PageSubheader>

      <Section>
        <FormGrid onSubmit={handleSave}>
          <InputGroup>
            <Label>Stall Name</Label>
            <Input value={stall?.name || ''} disabled style={{backgroundColor: '#f3f4f6', color: '#6b7280'}} />
            <HelperText>To change your stall name, please contact the event organizer.</HelperText>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="logoUrl">Logo Image URL</Label>
            <div style={{display: 'flex', gap: '24px', alignItems: 'flex-start'}}>
              {logoUrl && <ImagePreview src={logoUrl} alt="Stall Logo Preview" onError={(e) => e.target.src = 'https://placehold.co/120x120/e5e7eb/a3a3a3?text=No+Image'} />}
              <div style={{flex: 1}}>
                <Input 
                  id="logoUrl"
                  type="url" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/my-logo.png"
                  style={{width: '100%'}}
                />
                <HelperText>Paste a direct link to your logo image (PNG or JPG recommended).</HelperText>
              </div>
            </div>
          </InputGroup>

          <InputGroup>
            <Label htmlFor="description">About Your Stall</Label>
            <TextArea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your amazing food! e.g., 'Authentic Mumbai-style street food made with fresh ingredients.'"
            />
          </InputGroup>

          {message.text && (
            <p style={{
              padding: '12px', borderRadius: '8px', fontWeight: '500',
              backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: message.type === 'success' ? '#059669' : '#dc2626'
            }}>
              {message.text}
            </p>
          )}

          <SaveButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </SaveButton>
        </FormGrid>
      </Section>
    </PageContainer>
  );
}
