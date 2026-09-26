import { useState } from 'react';
import { Header } from './components/Header';
import { FloatingBottomNav } from './components/FloatingBottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { InsightsPage } from './pages/InsightsPage';
import { BrandsPage } from './pages/BrandsPage';
import { UsageHistoryPage } from './pages/UsageHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="app-layout">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />
      {activeTab === 'overview' && <DashboardPage />}
      {activeTab === 'insights' && <InsightsPage />}
      {activeTab === 'brands' && <BrandsPage />}
      {activeTab === 'history' && <UsageHistoryPage />}
      {activeTab === 'settings' && <SettingsPage />}
      <FloatingBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

export default App;
