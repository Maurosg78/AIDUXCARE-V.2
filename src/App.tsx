import { Routes, Route } from 'react-router-dom';
import Layout from './core/components/Layout';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        {/* Aquí se pueden agregar más rutas en el futuro */}
      </Route>
    </Routes>
  );
}

export default App; 