import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Breadcrumbs from './components/common/Breadcrumbs';
import CommandPalette from './components/common/CommandPalette';
import NexusHome from './pages/NexusHome';
import LocationInsights from './pages/LocationInsights';
import InventoryAnalytics from './pages/InventoryAnalytics';
import BrandAnalysis from './pages/BrandAnalysis';
import CustomerIntelligence from './pages/CustomerIntelligence';
import ConnectAgent from './pages/ConnectAgent';
import PricingAgent from './pages/PricingAgent';
import MarketingCampaigns from './pages/MarketingCampaigns';
import CustomerBridge from './pages/CustomerBridge';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K handler
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-surface-bg flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={<NexusHome />} />
            <Route path="/locations" element={<LocationInsights />} />
            <Route path="/inventory" element={<InventoryAnalytics />} />
            <Route path="/brands" element={<BrandAnalysis />} />
            <Route path="/customers" element={<CustomerIntelligence />} />
            <Route path="/agents/connect" element={<ConnectAgent />} />
            <Route path="/agents/pricing" element={<PricingAgent mode="agent" />} />
            <Route path="/agents/marketing" element={<MarketingCampaigns />} />
            <Route path="/agents/bridge" element={<CustomerBridge />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        navigate={navigate}
      />
    </div>
  );
}
