import { createContext, useContext, useState, useCallback } from 'react';

const GoalContext = createContext();

// Goal types supported across the platform
export const GOAL_TYPES = [
  { key: 'revenue', label: 'Revenue', unit: '$', format: v => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toLocaleString()}` },
  { key: 'transactions', label: 'Transactions', unit: '#', format: v => v.toLocaleString() },
  { key: 'aov', label: 'AOV', unit: '$', format: v => `$${v.toFixed(0)}` },
  { key: 'margin', label: 'Margin', unit: '%', format: v => `${v.toFixed(1)}%` },
  { key: 'labor', label: 'Labor Cost %', unit: '%', format: v => `${v.toFixed(1)}%`, defaultValue: 20 },
];

// Time period options for goal-setting
export const GOAL_PERIODS = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
];

export function GoalProvider({ children }) {
  // Goals keyed by "{storeName}:{goalType}" e.g. "Ascend Logan Square:revenue"
  const [storeGoals, setStoreGoals] = useState({});
  const [goalPeriod, setGoalPeriod] = useState('monthly');

  // Build a composite key for store + goal type
  const _key = (storeName, goalType = 'revenue') => `${storeName}:${goalType}`;

  const setGoal = useCallback((storeName, value, goalType = 'revenue') => {
    const key = `${storeName}:${goalType}`;
    setStoreGoals(prev => {
      const next = { ...prev };
      if (value === undefined || value === null || value === '') {
        delete next[key];
      } else {
        next[key] = Number(value);
      }
      return next;
    });
  }, []);

  const getGoal = useCallback((storeName, goalType = 'revenue') => {
    const key = `${storeName}:${goalType}`;
    return storeGoals[key] ?? null;
  }, [storeGoals]);

  const getPortfolioGoal = useCallback((stores, goalType = 'revenue') => {
    let total = 0;
    let hasAny = false;
    for (const s of stores) {
      const key = `${s.name}:${goalType}`;
      const val = storeGoals[key];
      if (val !== undefined && val !== null) {
        total += val;
        hasAny = true;
      }
    }
    return hasAny ? total : null;
  }, [storeGoals]);

  // Bulk operations — apply to a list of stores
  const bulkSetGoals = useCallback((stores, valuesFn, goalType = 'revenue') => {
    // valuesFn(store) => number | null
    setStoreGoals(prev => {
      const next = { ...prev };
      for (const store of stores) {
        const key = `${store.name}:${goalType}`;
        const val = valuesFn(store);
        if (val === undefined || val === null || val === '') {
          delete next[key];
        } else {
          next[key] = Number(val);
        }
      }
      return next;
    });
  }, []);

  const clearGoals = useCallback((stores, goalType = 'revenue') => {
    setStoreGoals(prev => {
      const next = { ...prev };
      for (const store of stores) {
        const key = `${store.name}:${goalType}`;
        delete next[key];
      }
      return next;
    });
  }, []);

  return (
    <GoalContext.Provider value={{
      storeGoals,
      goalPeriod,
      setGoalPeriod,
      setGoal,
      getGoal,
      getPortfolioGoal,
      bulkSetGoals,
      clearGoals,
    }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoals must be used within GoalProvider');
  return ctx;
}
