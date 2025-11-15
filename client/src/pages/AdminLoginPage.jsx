import { useState } from 'react';
import styled from 'styled-components';
import { publicAxios } from '../utils/apiAdapters';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

// ... (Keep all styled components exactly the same) ...
const PageContainer = styled.div` display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f9fafb; `;
const LoginBox = styled.div` background-color: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 48px; box-shadow: 0 4px 12px 0 rgb(0 0 0 / 0.05); width: 100%; max-width: 400px; `;
const PageHeader = styled.h1` font-size: 1.875rem; font-weight: 700; color: #111827; text-align: center; margin-top: 0; margin-bottom: 24px; `;
const Form = styled.form` display: grid; grid-template-columns: 1fr; gap: 16px; `;
const InputGroup = styled.div` display: flex; flex-direction: column; `;
const Label = styled.label` font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px; `;
const Input = styled.input` background-color: white; border: 1px solid #d1d5db; color: #111827; padding: 10px 14px; border-radius: 8px; font-size: 1rem; &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); } `;
const Button = styled.button` background-color: #2563eb; color: white; font-weight: 600; padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; transition: background-color 0.2s; margin-top: 8px; &:hover { background-color: #1d4ed8; } &:disabled { background-color: #9ca3af; cursor: not-allowed; } `;
const ErrorMessage = styled.p` font-size: 0.875rem; color: #ef4444; text-align: center; margin: 0; `;
// --- NEW: Info message for password set ---
const InfoMessage = styled(ErrorMessage)` color: #16a34a; background-color: #f0fdf4; padding: 10px; border-radius: 6px; `;


export default function AdminLoginPage() {
  const navigate = useNavigate(); 
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- NEW STATE for password reset ---
  const [tempToken, setTempToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [info, setInfo] = useState(null); // For success messages
  // --- END NEW STATE ---

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const response = await publicAxios.post('/organizer/login', {
        email: email,
        password: password,
      });

      // --- NEW LOGIC ---
      if (response.data.requiresPasswordChange) {
        setTempToken(response.data.tempToken);
        setError('This is your first login. Please set a new permanent password.');
        setLoading(false);
      } else {
        // Regular login
        login(response.data.organizer, response.data.token);
        navigate('/'); 
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  // --- NEW: Password set handler ---
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await publicAxios.post('/organizer/set-password', {
        tempToken: tempToken,
        newPassword: newPassword
      });
      // Success! Reset the form and ask them to log in again.
      setInfo(response.data.message); // "Password updated successfully..."
      setTempToken(null);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    } catch (err) {
      console.error("Error setting password:", err);
      setError(err.response?.data?.error || "Failed to set password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC ---

  // RENDER: Set New Password Form
  if (tempToken) {
    return (
      <PageContainer>
        <LoginBox>
          <PageHeader>Set Permanent Password</PageHeader>
          <Form onSubmit={handleSetPassword}>
            <InputGroup>
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </InputGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Set Password'}</Button>
          </Form>
        </LoginBox>
      </PageContainer>
    );
  }

  // RENDER: Regular Login Form
  return (
    <PageContainer>
      <LoginBox>
        <PageHeader>Event Manager Login</PageHeader>
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" required />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {info && <InfoMessage>{info}</InfoMessage>}
          <Button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
        </Form>
      </LoginBox>
    </PageContainer>
  );
}
