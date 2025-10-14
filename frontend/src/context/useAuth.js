import { useContext } from 'react';
import AuthContext from './AuthContext.jsx'; // Import the context object

// Custom hook for easier access
export const useAuth = () => {
  return useContext(AuthContext);
};