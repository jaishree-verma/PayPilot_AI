import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Menu,
  Sparkles,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  ExternalLink,
} from "lucide-react";
import { api, PayPalConfig } from "../api";

interface TopNavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings: () => void;
  onRefreshData?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
  onRefreshData,
}) => {
  const location = useLocation();
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getPayPalConfig();
        setConfig(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchConfig();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedDemo();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error("Seed error", e);
    } finally {
      setSeeding(false);
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Product Overview";
      case "/dashboard":
        return "Financial Operations Dashboard";
      case "/agent":
        return "PayPilot AI Assistant";
      case "/invoices":
        return "Invoices & Billing";
      case "/payouts":
        return "Contractor Disbursements";
      case "/workflows":
        return "Workflow Automations";
      case "/transactions":
        return "Financial Ledger";
      case "/insights":
        return "Financial Insights & Audit";
      default:
        return "PayPilot AI";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium mt-0.5">
            Enterprise Autonomous Payment Platform
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Sandbox Status Pill */}
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition text-xs font-medium cursor-pointer"
          title="Click to view & configure PayPal Sandbox"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              config?.is_connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span className="text-slate-700 hidden sm:inline">
            {config?.is_connected
              ? "Sandbox: Connected"
              : config?.client_id_configured
              ? "Sandbox: Configured"
              : "Sandbox: Demo Mode"}
          </span>
        </button>

        {/* Quick Seed Demo Button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition text-xs font-semibold cursor-pointer"
          title="Populate test data for judge evaluation"
        >
          <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${seeding ? "animate-spin" : ""}`} />
          <span className="hidden md:inline">Seed Demo Data</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
          title="Settings & Credentials"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
          AM
        </div>
      </div>
    </header>
  );
};
