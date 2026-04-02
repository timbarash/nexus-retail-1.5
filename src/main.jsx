import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { StoreProvider } from './contexts/StoreContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { PersonaProvider } from './contexts/PersonaContext';
import { AlertProvider } from './contexts/AlertContext';
import { ActionLogProvider } from './contexts/ActionLogContext';
import { NexusStateProvider } from './contexts/NexusStateContext';
import { GoalProvider } from './contexts/GoalContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <PersonaProvider>
          <StoreProvider>
            <DateRangeProvider>
              <AlertProvider>
                <ActionLogProvider>
                <NexusStateProvider>
                <GoalProvider>
                  <App />
                </GoalProvider>
                </NexusStateProvider>
                </ActionLogProvider>
              </AlertProvider>
            </DateRangeProvider>
          </StoreProvider>
        </PersonaProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
