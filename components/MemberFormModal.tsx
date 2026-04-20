import React, { useState } from 'react';
import { Member } from '../types';
import { X, UserPlus, FileEdit, Camera, Upload, Loader2 } from 'lucide-react';
import { NepaliDatePicker, makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialData?: Member | null;
  existingMembers?: Member[];
}

// Generate next member number like CLR-021, CLR-022, etc.
function generateMemberNumber(existingMembers: Member[]): string {
  const prefix = 'CLR-';
  let maxNum = 0;
  existingMembers.forEach(m => {
    const match = m.memberNumber.match(/CLR-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingMembers = []
}) => {
  const [formData, setFormData] = useState({
    memberNumber: initialData?.memberNumber || generateMemberNumber(existingMembers),
    name: initialData?.name || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    dob: initialData?.dob || '',
    address: initialData?.address || '',
    emergencyContact: initialData?.emergencyContact || '',
    emergencyContact2: initialData?.emergencyContact2 || '',
    bloodGroup: initialData?.bloodGroup || '',
    accessLevel: initialData?.accessLevel || 'Gym',
    joinedDate: initialData?.joinedDate || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    profilePicture: initialData?.profilePicture || '',
    thumbnail: initialData?.thumbnail || '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = (file: File): Promise<{ full: string, thumb: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Could not get canvas context');

          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          canvas.width = 1080;
          canvas.height = 1080;
          ctx.drawImage(img, x, y, size, size, 0, 0, 1080, 1080);
          const full = canvas.toDataURL('image/jpeg', 0.4);

          canvas.width = 128;
          canvas.height = 128;
          ctx.drawImage(img, x, y, size, size, 0, 0, 128, 128);
          const thumb = canvas.toDataURL('image/jpeg', 0.3);

          resolve({ full, thumb });
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const { full, thumb } = await processImage(file);
      setFormData(prev => ({ ...prev, profilePicture: full, thumbnail: thumb }));
    } catch (err) {
      console.error('Image processing failed:', err);
      alert('Failed to process image. Please try another one.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-colors";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
               {initialData ? <FileEdit className="w-5 h-5"/> : <UserPlus className="w-5 h-5"/>}
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {initialData ? 'Edit Member' : 'New Member'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Enter member details below</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="space-y-8">

            {/* ─── Photo & Member No ─── */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
               <div className="flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                    {formData.profilePicture ? (
                      <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">No Photo</span>
                      </div>
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                         <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => document.getElementById('profile-camera')?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                      <Camera className="w-3.5 h-3.5" /> Camera
                    </button>
                    <button type="button" onClick={() => document.getElementById('profile-upload')?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                  </div>
                  <input id="profile-camera" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Photo</p>
               </div>

               <div className="flex-1 w-full space-y-5">
                  <div>
                     <label className={labelClass}>Member No <span className="text-slate-400 normal-case">(Auto-assigned)</span></label>
                     <input type="text" name="memberNumber" value={formData.memberNumber} readOnly className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed font-mono font-bold`} />
                  </div>
                  <div>
                     <label className={labelClass}>Gender</label>
                     <select name="gender" required value={formData.gender} onChange={handleChange} className={inputClass}>
                       <option value="">Select Gender</option>
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                       <option value="Other">Other</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* ─── Personal Details ─── */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className={labelClass}>Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Ram Bahadur Thapa" />
                 </div>
                 <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="ram@example.com" />
                 </div>
                 <div>
                    <label className={labelClass}>Phone</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} placeholder="98XXXXXXXX" />
                 </div>
                 <div>
                    <label className={labelClass}>DOB</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                 </div>
                 <div className="relative z-[100]">
                    <label className={labelClass}>Joined Date</label>
                    <NepaliDatePicker 
                      value={formData.joinedDate ? makeDualDateValueFromAd(new Date(formData.joinedDate)) : null}
                      onChange={(val) => setFormData(prev => ({ ...prev, joinedDate: val?.formatted.ad || '' }))}
                      format="YYYY-MM-DD"
                      showCalendarSystemToggle={true}
                      showLanguageToggle={true}
                      classNames={{
                         input: inputClass
                      }}
                    />
                 </div>
                 <div>
                    <label className={labelClass}>Access Level</label>
                    <select name="accessLevel" value={formData.accessLevel} onChange={handleChange} className={inputClass}>
                      <option value="Gym">Gym</option>
                      <option value="Gym + Cardio">Gym + Cardio</option>
                      <option value="Gym + Cardio + PT">Gym + Cardio + PT</option>
                    </select>
                 </div>
              </div>
            </div>

            {/* ─── Emergency & Health ─── */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Emergency & Health</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <div>
                    <label className={labelClass}>Emergency Contact 1</label>
                    <input type="text" name="emergencyContact" required value={formData.emergencyContact} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="Name - Phone" />
                 </div>
                  <div>
                    <label className={labelClass}>Emergency Contact 2</label>
                    <input type="text" name="emergencyContact2" value={formData.emergencyContact2} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="Name - Phone" />
                 </div>
                  <div>
                    <label className={labelClass}>Blood Group</label>
                    <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="O+, B+, etc." />
                 </div>
                 <div>
                    <label className={labelClass}>Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none" placeholder="Any injuries, allergies, or goals..."></textarea>
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end gap-3 flex-col sm:flex-row">
            <button type="button" onClick={onClose} className="px-6 py-3.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isProcessing} className="px-6 py-3.5 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Save Changes' : 'Create Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberFormModal;
