import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';
import { AppProvider } from '../src/context/AppContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </HelmetProvider>
  </StrictMode>
);
