import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Zorg dat Tailwind hier geïmporteerd/geconfigureerd is
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { setupGlobalErrorHandling } from './utils/errorHandling';

// Initialize global error handling
setupGlobalErrorHandling();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);