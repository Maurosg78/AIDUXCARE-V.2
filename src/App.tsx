import { BrowserRouter as Router } from 'react-router-dom';
import { AppRouter } from './router/router';
import './App.css';

function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

export default App; 