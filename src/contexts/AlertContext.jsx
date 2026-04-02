import { createContext, useContext, useState } from 'react';
const AlertContext = createContext();
export const useAlerts = () => useContext(AlertContext);
export function AlertProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(5);
  const markRead = (n = 1) => setUnreadCount(prev => Math.max(0, prev - n));
  const resetAlerts = () => setUnreadCount(5);
  return <AlertContext.Provider value={{ unreadCount, markRead, resetAlerts }}>{children}</AlertContext.Provider>;
}
