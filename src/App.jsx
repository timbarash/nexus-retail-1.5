import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useNexusState } from './contexts/NexusStateContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import BottomTabBar from './components/layout/BottomTabBar';
import ErrorBoundary from './components/common/ErrorBoundary';
import NexusHome from './pages/NexusHome';
import LocationInsights from './pages/LocationInsights';
import InventoryActions from './pages/InventoryActions';
import InventoryAnalytics from './pages/InventoryAnalytics';
import BrandAnalysis from './pages/BrandAnalysis';
import CustomerIntelligence from './pages/CustomerIntelligence';
import ConnectAgent from './pages/ConnectAgent';
import PricingAgent from './pages/PricingAgent';
import MarketingCampaigns from './pages/MarketingCampaigns';
import CustomerBridge from './pages/CustomerBridge';
import Dutchie3Study from './pages/Dutchie3Study';
import NexusMarketing from './pages/NexusMarketing';
import NexusVideo from './pages/NexusVideo';
import NexusMarketingV2 from './pages/NexusMarketingV2';
import NexusVideoV2 from './pages/NexusVideoV2';
import NexusVideoV3 from './pages/NexusVideoV3';

export default function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isThinking } = useNexusState();

  // Study page renders standalone — no sidebar/header/footer
  if (location.pathname === '/study') {
    return <ErrorBoundary><Dutchie3Study /></ErrorBoundary>;
  }

  // Marketing page renders standalone — no sidebar/header/footer
  if (location.pathname === '/marketing') {
    return <ErrorBoundary><NexusMarketing /></ErrorBoundary>;
  }

  // Video storyboard page renders standalone — no sidebar/header/footer
  if (location.pathname === '/video') {
    return <ErrorBoundary><NexusVideo /></ErrorBoundary>;
  }

  // Marketing V2 page renders standalone — no sidebar/header/footer
  if (location.pathname === '/marketing-v2') {
    return <ErrorBoundary><NexusMarketingV2 /></ErrorBoundary>;
  }

  // Video V2 page renders standalone — no sidebar/header/footer
  if (location.pathname === '/video-v2') {
    return <ErrorBoundary><NexusVideoV2 /></ErrorBoundary>;
  }

  // Video V3 page renders standalone — no sidebar/header/footer
  if (location.pathname === '/video-v3') {
    return <ErrorBoundary><NexusVideoV3 /></ErrorBoundary>;
  }

  const isAgentPage = location.pathname.startsWith('/agents');

  return (
    <div className="h-screen bg-surface-bg flex overflow-hidden" data-nexus-thinking={isThinking ? 'true' : undefined}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main key={location.pathname} className={`page-transition flex-1 min-h-0 pb-16 lg:pb-0 ${isAgentPage ? 'p-4 md:p-5 lg:p-6 flex flex-col' : 'p-4 md:p-5 lg:p-6 overflow-auto'}`}>
          <Routes>
            <Route path="/" element={<NexusHome />} />
            <Route path="/locations" element={<LocationInsights />} />
            <Route path="/inventory" element={<InventoryActions />} />
            <Route path="/inventory/analytics" element={<InventoryAnalytics />} />
            <Route path="/brands" element={<BrandAnalysis />} />
            <Route path="/customers" element={<CustomerIntelligence />} />
            <Route path="/agents/connect" element={<ErrorBoundary><ConnectAgent /></ErrorBoundary>} />
            <Route path="/agents/pricing" element={<ErrorBoundary><PricingAgent mode="agent" /></ErrorBoundary>} />
            <Route path="/agents/marketing" element={<ErrorBoundary><MarketingCampaigns /></ErrorBoundary>} />
            <Route path="/agents/bridge" element={<ErrorBoundary><CustomerBridge /></ErrorBoundary>} />
            <Route path="/agents/customer" element={<Navigate to="/agents/bridge" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {/* Footer removed — unnecessary chrome */}
        <BottomTabBar />
      </div>
    </div>
  );
}
