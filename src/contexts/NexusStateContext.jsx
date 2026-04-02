import { createContext, useContext, useState, useCallback } from 'react';
const NexusStateContext = createContext();
export const useNexusState = () => useContext(NexusStateContext);
export function NexusStateProvider({ children }) {
  const [isThinking, setIsThinking] = useState(false);
  const startThinking = useCallback(() => setIsThinking(true), []);
  const stopThinking = useCallback(() => setIsThinking(false), []);
  return (
    <NexusStateContext.Provider value={{ isThinking, startThinking, stopThinking }}>
      {children}
    </NexusStateContext.Provider>
  );
}
