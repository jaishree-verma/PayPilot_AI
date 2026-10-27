import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bot,
  LayoutDashboard,
  FileText,
  Send,
  GitBranch,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { api, PayPalConfig } from "../api";

interface NavbarProps {
  onOpenSettings: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onRefreshData }) => {
  const location = useLocation();
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchConfig = async () => {
    try {
      const data = await api.getPayPalConfig();
      setConfig(data);
    } catch (e) {
      console.error("Failed to load PayPal config", e);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedDemo();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error("Seed failed", e);
    } finally {
      setSeeding(false);
    }
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/agent", label: "AI Agent", icon: Bot, highlight: true },
    { to: "/invoices", label: "Invoices", icon: FileText },
    { to: "/payouts", label: "Payouts", icon: Send },
    { to: "/workflows", label: "Workflows", icon: GitBranch },
    { to: "/transactions", label: "Ledger", icon: Receipt },
    { to: "/insights", label: "Insights & Audit", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  PayPilot<span className="text-sky-400 font-extrabold">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  PayPal Sandbox
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Autonomous Payment Operations</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 pl-4">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800 text-sky-400 border border-slate-700/80 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  } ${item.highlight && !isActive ? "text-indigo-400 hover:text-indigo-300" : ""}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Connection Status Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 hover:bg-slate-800 transition text-xs font-medium"
            title="Click to view & configure PayPal Sandbox and AI provider"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config?.is_connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-slate-300 hidden sm:inline">
              {config?.is_connected
                ? "PayPal Live Sandbox"
                : config?.client_id_configured
                ? "PayPal Configured"
                : "Sandbox Demo Mode"}
            </span>
          </button>

          {/* Quick Seed Demo Button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 transition text-xs font-semibold"
            title="Populate test data for judge evaluation"
          >
            <Sparkles className={`w-3.5 h-3.5 ${seeding ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">Seed Demo</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            title="Configure Sandbox Keys and AI Provider"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
