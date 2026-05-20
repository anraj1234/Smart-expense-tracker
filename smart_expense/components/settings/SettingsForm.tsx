"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { updateSettings } from "@/app/actions/settings";
import { Save, User as UserIcon, Mail, Globe, CheckCircle2 } from "lucide-react";

type SettingsFormProps = {
  initialData: User;
};

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name || "");
  const [currency, setCurrency] = useState(initialData.currency || "USD");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    const res = await updateSettings(initialData.id, { name, currency });
    
    setIsLoading(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-emerald-900/40 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0a0a0a]/50">
        <h3 className="font-bold text-slate-900 dark:text-emerald-400 text-lg">Profile Information</h3>
        <p className="text-sm text-slate-500 dark:text-emerald-600">Update your account details and preferences here.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Email - Readonly */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              value={initialData.email} 
              disabled
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-emerald-900/40 rounded-lg text-slate-500 dark:text-emerald-600 cursor-not-allowed text-sm"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-emerald-600 mt-1.5">Your email address is used for login and cannot be changed.</p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border border-slate-200 dark:border-emerald-900/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all outline-none text-slate-900 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Currency Preference */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Default Currency</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border border-slate-200 dark:border-emerald-900/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all outline-none text-slate-900 dark:text-emerald-400 appearance-none"
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="AUD">AUD ($) - Australian Dollar</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-between">
        <div className="flex-1">
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Settings saved successfully!</span>
            </div>
          )}
        </div>
        <button 
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-lg font-medium transition-colors shadow-sm shadow-blue-600/20"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  );
}
