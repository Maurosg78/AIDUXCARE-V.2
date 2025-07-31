import { useState, useEffect } from 'react';

interface User {
  displayName: string;
  email: string;
  professionalTitle: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de usuario
    const loadUser = () => {
      // Mock user data for demo
      const mockUser: User = {
        displayName: 'Dr. Mauricio Sobarzo',
        email: 'msobarzo78@gmail.com',
        professionalTitle: 'FT'
      };
      
      setUser(mockUser);
      setLoading(false);
    };

    // Simular delay de carga
    setTimeout(loadUser, 500);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user
  };
}; 