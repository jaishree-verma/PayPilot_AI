import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  FileText,
  Send,
  GitBranch,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
  X,
  CreditCard,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/agent", label: "AI Agent", icon: Bot, badge: "AI" },
    { to: "/invoices", label: "Invoices", icon: FileText },
    { to: "/payouts", label: "Contractor Payouts", icon: Send },
    { to: "/workflows", label: "Workflow Automation", icon: GitBranch },
    { to: "/transactions", label: "Transactions", icon: Receipt },
    { to: "/insights", label: "Financial Insights", icon: BarChart3 },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <Link to="/" onClick={onClose} className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-700 transition">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">
                PayPilot<span className="text-blue-600">.AI</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Fintech Autonomous Agent</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sandbox Badge Banner */}
      <div className="px-5 pt-4 pb-2">
        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-blue-900">PayPal Sandbox</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white text-blue-600 border border-blue-200 shadow-2xs">
            Live Ready
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Preferences
        </div>
        <button
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Sandbox & API Settings</span>
        </button>
      </nav>

      {/* User / Operator Profile Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">Alex Mercer</div>
            <div className="text-[11px] text-slate-500 truncate">Mercer Tech Labs</div>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
