import React, { createContext, useContext, useState, useMemo } from 'react';
import { Building2, Globe, MapPin, Store, Shield } from 'lucide-react';

const PERSONAS = [
  { id: 'ceo', label: 'CEO / Corporate', scope: 'portfolio', icon: Building2, shortLabel: 'CEO', storeFilter: null },
  { id: 'vp_retail', label: 'VP of Retail', scope: 'region', defaultRegion: ['IL', 'MI', 'OH'], icon: Globe, shortLabel: 'VP Retail', storeFilter: { states: ['IL', 'MI', 'OH'] } },
  { id: 'regional_mgr', label: 'Regional Manager, IL', scope: 'state', defaultState: 'IL', icon: MapPin, shortLabel: 'Regional IL', storeFilter: { states: ['IL'] } },
  { id: 'store_mgr', label: 'Store Operator, Logan Square', scope: 'store', defaultStore: 'Ascend Logan Square', icon: Store, shortLabel: 'Store Op', storeFilter: { store: 'Ascend Logan Square' } },
  { id: 'compliance', label: 'Compliance Officer', scope: 'portfolio', icon: Shield, shortLabel: 'Compliance', storeFilter: null },
];

const PersonaContext = createContext(null);

export function PersonaProvider({ children }) {
  const [selectedPersonaId, setSelectedPersonaId] = useState('ceo');

  const value = useMemo(() => {
    const selectedPersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];
    return {
      personas: PERSONAS,
      selectedPersona,
      selectedPersonaId,
      setSelectedPersona: setSelectedPersonaId,
      isPortfolioScope: selectedPersona.scope === 'portfolio',
      isRegionScope: selectedPersona.scope === 'region',
      isStateScope: selectedPersona.scope === 'state',
      isStoreScope: selectedPersona.scope === 'store',
      isCEO: selectedPersonaId === 'ceo',
      isVP: selectedPersonaId === 'vp_retail',
      isRegional: selectedPersonaId === 'regional_mgr',
      isStoreMgr: selectedPersonaId === 'store_mgr',
      isCompliance: selectedPersonaId === 'compliance',
      showCrossStore: ['ceo', 'vp_retail', 'regional_mgr'].includes(selectedPersonaId),
    };
  }, [selectedPersonaId]);

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used within PersonaProvider');
  return ctx;
}

export { PERSONAS };
