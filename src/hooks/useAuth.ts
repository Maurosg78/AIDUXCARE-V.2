import { useState, useEffect } from 'react';

interface User {
  displayName: string;
  email: string;
  professionalTitle: string;
  specialty: string;
  country: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos del usuario desde storage
    const loadUser = () => {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
      const userEmail = sessionStorage.getItem('userEmail');
      const userData = localStorage.getItem('userData');
      
      if (isAuthenticated && userEmail) {
        try {
          // Intentar obtener datos del usuario desde localStorage
          let userInfo: User;
          
          if (userData) {
            const parsedData = JSON.parse(userData);
            userInfo = {
              displayName: parsedData.displayName || 'Usuario',
              email: userEmail,
              professionalTitle: parsedData.professionalTitle || 'FT',
              specialty: parsedData.specialty || 'Fisioterapia',
              country: parsedData.country || 'España'
            };
          } else {
            // Datos por defecto si no hay información guardada
            userInfo = {
              displayName: 'Usuario',
              email: userEmail,
              professionalTitle: 'FT',
              specialty: 'Fisioterapia',
              country: 'España'
            };
          }
          
          setUser(userInfo);
        } catch (error) {
          console.error('Error loading user data:', error);
          // Datos por defecto en caso de error
          setUser({
            displayName: 'Usuario',
            email: userEmail,
            professionalTitle: 'FT',
            specialty: 'Fisioterapia',
            country: 'España'
          });
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    // Simular delay de carga
    setTimeout(loadUser, 500);
  }, []);

  const login = (userData: Partial<User>) => {
    // Guardar datos del usuario
    localStorage.setItem('userData', JSON.stringify(userData));
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userEmail', userData.email || '');
    
    setUser({
      displayName: userData.displayName || 'Usuario',
      email: userData.email || '',
      professionalTitle: userData.professionalTitle || 'FT',
      specialty: userData.specialty || 'Fisioterapia',
      country: userData.country || 'España'
    });
  };

  const logout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
}; 