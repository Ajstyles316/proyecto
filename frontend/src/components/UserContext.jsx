import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const useIsReadOnly = () => {
  const { user } = useUser();
  // Si es admin o encargado, nunca es solo lectura
  if (user && (user.Cargo?.toLowerCase() === 'admin' || user.Cargo?.toLowerCase() === 'encargado')) {
    return false;
  }
  return user && user.Permiso && user.Permiso.toLowerCase() === "lector";
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}; 