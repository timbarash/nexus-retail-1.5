import { createContext, useContext, useState, useCallback } from 'react';

const ActionLogContext = createContext();
export const useActionLog = () => useContext(ActionLogContext);

export function ActionLogProvider({ children }) {
  const [actions, setActions] = useState([]);

  const logAction = useCallback((action) => {
    setActions(prev => [{
      id: Date.now(),
      timestamp: new Date(),
      ...action,
      status: action.status || 'completed',
    }, ...prev]);
  }, []);

  return (
    <ActionLogContext.Provider value={{ actions, logAction }}>
      {children}
    </ActionLogContext.Provider>
  );
}
