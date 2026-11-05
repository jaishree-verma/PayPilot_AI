import React, { useState, useEffect } from "react";
import { X, Users, Plus, CheckCircle2, Trash2, Mail, ShieldCheck, Search } from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";

interface RecipientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const RecipientManagerModal: React.FC<RecipientManagerModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMode, setIsAddMode] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [category, setCategory] = useState("Contractor");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const data = await api.getRecipients();
      setRecipients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
      setIsAddMode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await api.createRecipient({
        name: name.trim(),
        email: email.trim(),
        paypal_email: (paypalEmail.trim() || email.trim()),
        category,
        verified: true,
        notes: notes.trim() || undefined,
      });
      showToast(`Added contact ${name}`, "success");
      setName("");
      setEmail("");
      setPaypalEmail("");
      setNotes("");
      setIsAddMode(false);
      fetchRecipients();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showToast(err.message || "Failed to add recipient", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, recName: string) => {
    try {
      await api.deleteRecipient(id);
      showToast(`Removed recipient ${recName}`, "success");
      fetchRecipients();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showToast(err.message || "Cannot delete recipient", "error");
    }
  };

  const filtered = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verified Contacts & Payees</h3>
              <p className="text-xs text-slate-500">Contractors, clients, and PayPal accounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setIsAddMode(!isAddMode)}
              className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddMode ? "Cancel" : "Add Contact"}</span>
            </button>
          </div>

          {/* Add Contact Sub-Form */}
          {isAddMode && (
            <form onSubmit={handleAdd} className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3 animate-in fade-in">
              <h4 className="font-bold text-slate-900">Add New Verified Contact</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900"
                  >
                    <option value="Contractor">Contractor</option>
                    <option value="Client">Client</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">Notification Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">PayPal Account Email</label>
                  <input
                    type="email"
                    placeholder="paypal@sandbox.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-600">Notes / Scope</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Frontend React Developer"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  {saving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          )}

          {/* Recipients List */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            {filtered.length > 0 ? (
              filtered.map((r) => (
                <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{r.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          r.category === "Contractor"
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {r.category}
                      </span>
                      {r.verified && (
                        <span className="flex items-center space-x-0.5 text-emerald-600 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
                      <span>{r.email}</span>
                      <span>•</span>
                      <span className="text-blue-600">PayPal: {r.paypal_email}</span>
                    </div>
                    {r.notes && <p className="text-[11px] text-slate-400 italic">{r.notes}</p>}
                  </div>

                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">No contacts found matching search.</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-150 bg-slate-50/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

