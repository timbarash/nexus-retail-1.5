import React, { createContext, useContext, useState, useMemo } from 'react';
import { locations } from '../data/mockData';

// Pre-compute grouped stores by state
const STATE_ORDER = ['IL', 'MD', 'MA', 'MI', 'NJ', 'OH', 'PA'];
const storesByState = {};
STATE_ORDER.forEach(st => {
  storesByState[st] = locations.filter(l => l.state === st);
});

const allStoreNames = locations.map(l => l.name);

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [selectedStoreNames, setSelectedStoreNames] = useState(() => new Set(allStoreNames));

  const value = useMemo(() => {
    const selectedStores = locations.filter(l => selectedStoreNames.has(l.name));
    const isAllSelected = selectedStoreNames.size === allStoreNames.length;

    // Per-state status: 'all' | 'some' | 'none'
    const selectedStates = {};
    STATE_ORDER.forEach(st => {
      const stateStores = storesByState[st];
      const selectedCount = stateStores.filter(s => selectedStoreNames.has(s.name)).length;
      selectedStates[st] = {
        status: selectedCount === 0 ? 'none' : selectedCount === stateStores.length ? 'all' : 'some',
        selected: selectedCount,
        total: stateStores.length,
      };
    });

    // Label for the selector button
    let selectionLabel;
    if (isAllSelected) {
      selectionLabel = `All Stores (${allStoreNames.length})`;
    } else if (selectedStoreNames.size === 0) {
      selectionLabel = 'No Stores Selected';
    } else if (selectedStoreNames.size === 1) {
      selectionLabel = [...selectedStoreNames][0].replace('Ascend ', '');
    } else {
      // Check if exactly one state's stores are selected
      const activeStates = STATE_ORDER.filter(st => selectedStates[st].status !== 'none');
      if (activeStates.length === 1 && selectedStates[activeStates[0]].status === 'all') {
        selectionLabel = `${activeStates[0]} — All (${selectedStates[activeStates[0]].total})`;
      } else {
        selectionLabel = `${selectedStoreNames.size} Stores`;
      }
    }

    function toggleStore(name) {
      setSelectedStoreNames(prev => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      });
    }

    function toggleState(st) {
      setSelectedStoreNames(prev => {
        const next = new Set(prev);
        const stateStores = storesByState[st];
        const allSelected = stateStores.every(s => next.has(s.name));
        if (allSelected) {
          stateStores.forEach(s => next.delete(s.name));
        } else {
          stateStores.forEach(s => next.add(s.name));
        }
        return next;
      });
    }

    function selectAll() {
      setSelectedStoreNames(new Set(allStoreNames));
    }

    function clearAll() {
      setSelectedStoreNames(new Set());
    }

    function setStoresByPersona(persona) {
      if (!persona || !persona.storeFilter) {
        // Portfolio scope — select all
        setSelectedStoreNames(new Set(allStoreNames));
        return;
      }
      const filter = persona.storeFilter;
      if (filter.store) {
        // Single store
        setSelectedStoreNames(new Set([filter.store]));
      } else if (filter.states) {
        // States filter
        const names = locations
          .filter(l => filter.states.includes(l.state))
          .map(l => l.name);
        setSelectedStoreNames(new Set(names));
      } else {
        setSelectedStoreNames(new Set(allStoreNames));
      }
    }

    return {
      selectedStoreNames,
      selectedStores,
      storesByState,
      stateOrder: STATE_ORDER,
      selectedStates,
      isAllSelected,
      selectionLabel,
      toggleStore,
      toggleState,
      selectAll,
      clearAll,
      setStoresByPersona,
    };
  }, [selectedStoreNames]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStores() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStores must be used within StoreProvider');
  return ctx;
}
