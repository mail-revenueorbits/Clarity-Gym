import React, { useState, useEffect } from 'react';
import { settingsService, PricingMatrix } from '../services/settingsService';
import { Settings as SettingsIcon, Save, Loader2, Check, Edit2, X, QrCode, ExternalLink, Copy, Printer } from 'lucide-react';

const Settings: React.FC = () => {
  const [matrix, setMatrix] = useState<PricingMatrix | null>(null);
  const [originalMatrix, setOriginalMatrix] = useState<PricingMatrix | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const portalUrl = `${window.location.origin}/#/portal`;
  const checkinUrl = `${window.location.origin}/#/portal/checkin`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getPricingMatrix();
        setMatrix(data);
        setOriginalMatrix(JSON.parse(JSON.stringify(data)));
      } catch (error) {
        console.error('Failed to fetch pricing matrix', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handlePriceChange = (category: string, duration: string, value: string) => {
    if (!matrix) return;
    const numValue = parseInt(value, 10) || 0;
    
    setMatrix(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [duration]: numValue
        }
      };
    });
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    if (originalMatrix) {
      setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    }
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!matrix) return;
    setIsSaving(true);
    try {
      await settingsService.updatePricingMatrix(matrix);
      setOriginalMatrix(JSON.parse(JSON.stringify(matrix)));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save pricing matrix', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p>Loading settings...</p>
      </div>
    );
  }

  if (!matrix) return null;

  const categories = Object.keys(matrix);
  const durationOrder = ["1 Month", "3 Months", "6 Months", "1 Year"];
  const durations = Object.keys(matrix[categories[0]] || {}).sort((a, b) => {
    const idxA = durationOrder.indexOf(a);
    const idxB = durationOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Manage your gym packages and pricing</p>
        </div>
      </div>
      
      {/* Package Pricing Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Package Pricing</h2>
                 <p className="text-xs text-slate-500 font-medium">Configure the cost of each membership plan</p>
              </div>
           </div>
           {!isEditing ? (
             <button 
               onClick={() => setIsEditing(true)}
               className="p-3 font-bold rounded-xl transition-all shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
               title="Edit Prices"
             >
               <Edit2 className="w-5 h-5" />
             </button>
           ) : (
             <div className="flex items-center gap-2">
               <button 
                 onClick={handleCancel}
                 disabled={isSaving}
                 className="p-3 font-bold rounded-xl transition-all bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                 title="Cancel"
               >
                 <X className="w-5 h-5" />
               </button>
               <button 
                 onClick={handleSave} 
                 disabled={isSaving}
                 className={`p-3 font-bold rounded-xl transition-all shadow-sm ${
                   saveSuccess 
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                 } disabled:opacity-50`}
                 title="Save Changes"
               >
                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (saveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
               </button>
             </div>
           )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr>
                <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">Access Level / Category</th>
                {durations.map(duration => (
                  <th key={duration} className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 px-4 text-right">
                    {duration}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map((category) => (
                <tr key={category} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 pr-4">
                    <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">{category}</span>
                  </td>
                  {durations.map(duration => (
                    <td key={duration} className="py-5 px-4 text-right">
                      {isEditing ? (
                        <div className="relative inline-flex items-center justify-end">
                          <span className="absolute left-3 text-slate-400 text-sm font-medium">Rs.</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={matrix[category][duration] === 0 ? '' : matrix[category][duration]}
                            onChange={(e) => handlePriceChange(category, duration, e.target.value.replace(/\D/g, ''))}
                            className="w-32 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-right font-medium text-slate-700 transition-colors group-hover:border-slate-300"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-700 font-bold text-[15px]">Rs. {matrix[category][duration]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Portal Setup Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
             <QrCode className="w-5 h-5" />
           </div>
           <div>
              <h2 className="text-lg font-bold text-slate-900">Member Portal Setup</h2>
              <p className="text-xs text-slate-500 font-medium">Enable members to check-in via QR code</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">1. Portal URL</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Copy this URL and use it to generate a static QR code. Print and place the QR code at your gym entrance.
              </p>
              <div className="flex items-center gap-2 mt-3 p-1 pl-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-sm font-mono text-slate-600 truncate flex-1">{checkinUrl}</span>
                <button 
                  onClick={handleCopyUrl}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                    copySuccess ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">2. How it works</h3>
              <ul className="space-y-3">
                {[
                  "Member scans the static QR code at the entrance.",
                  "They log in once using their Phone and Portal Password.",
                  "The system automatically marks their attendance for the day.",
                  "The session is saved on their phone for instant check-in next time."
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-slate-600 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <a 
                href={portalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
              >
                Preview Portal <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center border border-slate-100 text-center">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Static QR Code Preview</h3>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkinUrl)}`} 
                alt="Portal Check-in QR Code" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Point camera to test</p>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
