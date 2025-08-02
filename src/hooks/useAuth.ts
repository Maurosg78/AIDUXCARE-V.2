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
      
      if (isAuthenticated && userEmail && userData) {
        try {
          // Solo cargar datos si existen y son válidos
          const parsedData = JSON.parse(userData);
          const userInfo: User = {
            displayName: parsedData.displayName || '',
            email: userEmail,
            professionalTitle: parsedData.professionalTitle || '',
            specialty: parsedData.specialty || '',
            country: parsedData.country || ''
          };
          
          // Solo establecer usuario si tiene datos válidos
          if (userInfo.displayName && userInfo.email) {
            setUser(userInfo);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(null);
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