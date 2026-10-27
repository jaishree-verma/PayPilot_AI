import React, { useState, useEffect } from "react";
import { X, Key, CheckCircle, AlertTriangle, RefreshCw, Trash2, Sparkles, ExternalLink } from "lucide-react";
import { api, PayPalConfig } from "../api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onDataChanged }) => {
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const loadConfig = async () => {
    try {
      const data = await api.getPayPalConfig();
      setConfig(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setTestResult(null);
      setActionMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testPayPalConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ connected: false, message: e.message || "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionMsg("");
    try {
      const res = await api.updatePayPalConfig({
        client_id: clientId,
        client_secret: clientSecret,
        gemini_api_key: geminiKey,
      });
      setActionMsg(res.message || "Settings updated successfully.");
      await loadConfig();
      onDataChanged();
    } catch (e: any) {
      setActionMsg(`Failed to update: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    try {
      await api.seedDemo();
      setActionMsg("Demo data successfully seeded!");
      onDataChanged();
    } catch (e: any) {
      setActionMsg(`Seed failed: ${e.message}`);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to clear all ledger and invoice records?")) return;
    try {
      await api.resetDemo();
      setActionMsg("Database reset to pristine clean state.");
      onDataChanged();
    } catch (e: any) {
      setActionMsg(`Reset failed: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Platform Configuration & Keys</h3>
              <p className="text-xs text-slate-500">PayPal Developer Sandbox & AI Model Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Status Banner */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start space-x-3">
            {config?.is_connected ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
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
            <span className="text-xs text-slate-700 font-medium">Verify PayPal Sandbox API:</span>
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
              className={`p-3.5 rounded-xl border text-xs ${
                testResult.connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <p className="font-bold">{testResult.connected ? "✓ Success" : "ℹ Sandbox Status"}</p>
              <p className="mt-0.5">{testResult.message}</p>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">PayPal Sandbox Client ID</label>
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
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PayPal Sandbox Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Google Gemini API Key (Optional)</label>
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
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                PayPilot features a deterministic fallback agent that runs fully offline without an API key.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              {saving ? "Updating..." : "Save & Apply Credentials"}
            </button>
          </form>

          {actionMsg && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 text-center font-medium">
              {actionMsg}
            </div>
          )}

          {/* Quick Demo Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleSeed}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Seed Realistic Demo Data</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
