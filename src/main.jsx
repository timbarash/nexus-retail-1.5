import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { StoreProvider } from './contexts/StoreContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { PersonaProvider } from './contexts/PersonaContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <PersonaProvider>
          <StoreProvider>
            <DateRangeProvider>
              <App />
            </DateRangeProvider>
          </StoreProvider>
        </PersonaProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
