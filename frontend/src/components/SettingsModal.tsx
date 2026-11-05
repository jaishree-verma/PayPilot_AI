import React, { useState, useEffect } from "react";
import { X, Key, CheckCircle, AlertTriangle, RefreshCw, Trash2, Sparkles, ExternalLink, Building, User } from "lucide-react";
import { api, PayPalConfig, UserProfile } from "../api";
import { useToast } from "../context/ToastContext";
import { ConfirmModal } from "./common/ConfirmModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onDataChanged }) => {
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [cfg, usr] = await Promise.all([
        api.getPayPalConfig().catch(() => null),
        api.getUserProfile().catch(() => null),
      ]);
      if (cfg) setConfig(cfg);
      if (usr) {
        setUserProfile(usr);
        setBusinessName(usr.business_name);
        setOperatorName(usr.name);
        setOperatorEmail(usr.email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testPayPalConnection();
      setTestResult(res);
      if (res.connected) {
        showToast("Connected to PayPal Sandbox REST API", "success");
      } else {
        showToast(res.message, "warning");
      }
    } catch (e: any) {
      setTestResult({ connected: false, message: e.message || "Test failed" });
      showToast(e.message || "Connection test failed", "error");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updatePayPalConfig({
        client_id: clientId,
        client_secret: clientSecret,
        gemini_api_key: geminiKey,
      });
      showToast(res.message || "PayPal Sandbox settings updated", "success");
      await loadData();
      onDataChanged();
    } catch (e: any) {
      showToast(`Failed to update: ${e.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateUserProfile({
        business_name: businessName,
        name: operatorName,
        email: operatorEmail,
      });
      showToast("Business profile updated", "success");
      onDataChanged();
    } catch (e: any) {
      showToast(e.message || "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSeed = async () => {
    try {
      await api.seedDemo();
      showToast("Realistic demonstration data seeded successfully!", "success");
      onDataChanged();
    } catch (e: any) {
      showToast(`Seed failed: ${e.message}`, "error");
    }
  };

  const handleResetConfirm = async () => {
    setIsResetConfirmOpen(false);
    try {
      await api.resetDemo();
      showToast("Database reset to pristine clean state.", "info");
      onDataChanged();
    } catch (e: any) {
      showToast(`Reset failed: ${e.message}`, "error");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Platform Settings & Credentials</h3>
                <p className="text-xs text-slate-500">PayPal Developer Sandbox, Profile & AI Engine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 text-xs">
            {/* Current Status Banner */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start space-x-3">
              {config?.is_connected ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">
                  {config?.is_connected ? "Connected to Official PayPal Sandbox" : "Running in Sandbox Demo Mode"}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {config?.status_message ||
                    "You can test the full AI-driven checkout and payouts workflow immediately. Configure live Sandbox credentials below to execute real REST API calls."}
                </p>
                {config?.client_id_preview && (
                  <p className="text-blue-700 font-mono text-[11px]">Client ID: {config.client_id_preview}</p>
                )}
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">Verify PayPal Sandbox API:</span>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
                <span>{testing ? "Testing..." : "Test Connection"}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border ${
                  testResult.connected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <p className="font-bold">{testResult.connected ? "✓ Success" : "ℹ Sandbox Status"}</p>
                <p className="mt-0.5">{testResult.message}</p>
              </div>
            )}

            {/* Business Profile Section */}
            <form onSubmit={handleSaveProfile} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Business & Operator Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Operator Name</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Operator Email</label>
                <input
                  type="email"
                  value={operatorEmail}
                  onChange={(e) => setOperatorEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition"
                >
                  {savingProfile ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </form>

            {/* Configuration Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">PayPal Sandbox Client ID</label>
                  <a
                    href="https://developer.paypal.com/dashboard/applications/sandbox"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Get Sandbox Keys</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="e.g. A21AAK..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">PayPal Sandbox Secret</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Google Gemini API Key (Optional)</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Get Gemini Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Leave blank to use built-in offline NLP agent"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  PayPilot features a deterministic fallback agent that runs fully offline without an API key.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm cursor-pointer"
              >
                {saving ? "Updating..." : "Save & Apply Credentials"}
              </button>
            </form>

            {/* Quick Demo Controls */}
            <div className="pt-4 border-t border-slate-150 flex items-center justify-between">
              <button
                onClick={handleSeed}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Seed Demo Data</span>
              </button>

              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Entire Database"
        message="Are you sure you want to clear all ledger transactions, active invoices, payouts, and action plans? This will restore the database to an empty, clean state."
        confirmLabel="Yes, Clear All Data"
        isDestructive={true}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
