import React, { createContext, useReducer, useEffect } from 'react';

// 1. Initial State
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null, 
  token: localStorage.getItem('token') || null,
  role: JSON.parse(localStorage.getItem('user'))?.role || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,
};

// 2. Reducer Function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.user.role,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return {
        ...initialState, // Reset to initial state (null user/token)
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
        return {
            ...state,
            isLoading: action.payload,
        };
    default:
      return state;
  }
};

// 3. Create the Context
const AuthContext = createContext(initialState);
export default AuthContext;

// 4. Context Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Simple useEffect to set loading state to false after initial load
  useEffect(() => {
    if (state.isLoading) {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isLoading]);

  // Public functions for API calls (will be built out in the next step)
  const login = (userData, token) => {
    dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: userData, token } 
    });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (updatedUser) => {
    // Update both state and localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: updatedUser, token: state.token } 
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
