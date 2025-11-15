import { useContext } from 'react';
import { VisitorAuthContext } from '../context/VisitorAuthContext'; // We will update this import next

// This hook simply imports the context and exports the hook.
// This separation fixes the Vite HMR bug.
export const useVisitorAuth = () => {
  return useContext(VisitorAuthContext);
};