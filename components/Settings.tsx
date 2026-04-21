import React, { useState, useEffect } from 'react';
import { settingsService, PricingMatrix } from '../services/settingsService';
import { Settings as SettingsIcon, Save, Loader2, Check, Edit2, X } from 'lucide-react';

const Settings: React.FC = () => {
  const [matrix, setMatrix] = useState<PricingMatrix | null>(null);
  const [originalMatrix, setOriginalMatrix] = useState<PricingMatrix | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
  // Get all unique durations from the first category (assuming all categories have same durations)
  const durations = Object.keys(matrix[categories[0]] || {});

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Package Pricing</h2>
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
    </div>
  );
};

export default Settings;
