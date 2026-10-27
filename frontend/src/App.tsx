import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopNavbar } from "./components/TopNavbar";
import { SettingsModal } from "./components/SettingsModal";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AIAgentPage } from "./pages/AIAgentPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { PayoutsPage } from "./pages/PayoutsPage";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { InsightsPage } from "./pages/InsightsPage";
import { ExternalLink } from "lucide-react";

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Content Area (offset by sidebar width on desktop) */}
        <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
          {/* Top Navbar */}
          <TopNavbar
            onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRefreshData={handleDataChanged}
          />

          {/* Routed Views */}
          <main className="flex-1 bg-[#F8FAFC]">
            <Routes>
              <Route path="/" element={<LandingPage onOpenSettings={() => setIsSettingsOpen(true)} />} />
              <Route path="/dashboard" element={<DashboardPage key={refreshKey} />} />
              <Route path="/agent" element={<AIAgentPage key={refreshKey} />} />
              <Route path="/invoices" element={<InvoicesPage key={refreshKey} />} />
              <Route path="/payouts" element={<PayoutsPage key={refreshKey} />} />
              <Route path="/workflows" element={<WorkflowsPage key={refreshKey} />} />
              <Route path="/transactions" element={<TransactionsPage key={refreshKey} />} />
              <Route path="/insights" element={<InsightsPage key={refreshKey} />} />
              <Route path="*" element={<LandingPage onOpenSettings={() => setIsSettingsOpen(true)} />} />
            </Routes>
          </main>

          {/* Professional Clean Footer */}
          <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">PayPilot AI</span>
                <span>—</span>
                <span>Autonomous Payment Operations with Official PayPal Sandbox APIs</span>
              </div>
              <div className="flex items-center space-x-6 text-slate-500">
                <a
                  href="https://developer.paypal.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-600 transition flex items-center space-x-1"
                >
                  <span>PayPal Developer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hover:text-blue-600 transition cursor-pointer"
                >
                  Sandbox Configuration
                </button>
              </div>
            </div>
          </footer>
        </div>

        {/* Global Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onDataChanged={handleDataChanged}
        />
      </div>
    </Router>
  );
};

export default App;
