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

export const useCanManageRoles = () => {
  const { user } = useUser();
  return user && user.Cargo?.toLowerCase() === 'admin';
};

export const useCanEditMaquinaria = () => {
  const { user } = useUser();
  if (!user) return false;
  
  const cargo = user.Cargo?.toLowerCase();
  if (cargo === 'admin') return false; // Admin no puede editar maquinaria
  if (cargo === 'encargado') return true; // Encargado puede editar
  if (cargo === 'tecnico') {
    // Técnico puede editar según permisos granulares
    return user.permisos?.Maquinaria?.editar || false;
  }
  return false;
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