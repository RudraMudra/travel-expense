import { createContext, useContext, useState } from 'react';
import {jwtDecode} from 'jwt-decode'; // Install with: npm install jwt-decode

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return { token, role: localStorage.getItem('role'), userId: decoded.userId || 'defaultUserId' };
      } catch (e) {
        return { token, role: localStorage.getItem('role'), userId: 'defaultUserId' };
      }
    }
    return { token: null, role: null, userId: null };
  });

  // useEffect(() => {
  //   console.log('Auth initialized:', auth);
  //   setAuth((prev) => ({ ...prev, token: localStorage.getItem('token'), role: localStorage.getItem('role') }));
  // }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};