import { RouterProvider } from 'react-router-dom';
import router from './router/router';
import { ProfessionalProfileProvider } from './context/ProfessionalProfileContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ProfessionalProfileProvider>
        <RouterProvider router={router} />
      </ProfessionalProfileProvider>
    </AuthProvider>
  );
}

export default App; 