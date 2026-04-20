import React, { useState } from 'react';
import { Member } from '../types';
import { X, UserPlus, FileEdit, Camera, Upload, Loader2 } from 'lucide-react';
import { NepaliDatePicker, makeDualDateValueFromAd } from '@etpl/nepali-datepicker';
interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialData?: Member | null;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState({
    memberNumber: initialData?.memberNumber || '',
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    emergencyContact: initialData?.emergencyContact || '',
    bloodGroup: initialData?.bloodGroup || '',
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

          // Calculate center crop for 1:1
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          // Process Main Image (1080x1080)
          canvas.width = 1080;
          canvas.height = 1080;
          ctx.drawImage(img, x, y, size, size, 0, 0, 1080, 1080);
          const full = canvas.toDataURL('image/jpeg', 0.4); // High compression

          // Process Thumbnail (128x128)
          canvas.width = 128;
          canvas.height = 128;
          ctx.drawImage(img, x, y, size, size, 0, 0, 128, 128);
          const thumb = canvas.toDataURL('image/jpeg', 0.3); // Even higher compression for list

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                  {initialData ? 'Edit Member Profile' : 'New Gym Member'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Enter customer details below</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="space-y-8">
            {/* Core Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                 Personal Details
              </h3>
              
              <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                 {/* Profile Picture Upload Section */}
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
                    {/* Two separate buttons: Camera & Upload */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('profile-camera')?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" /> Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('profile-upload')?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </button>
                    </div>
                    {/* Hidden input for CAMERA capture */}
                    <input 
                      id="profile-camera"
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    {/* Hidden input for FILE upload */}
                    <input 
                      id="profile-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Profile Image</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 w-full">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Member ID / Number</label>
                    <input type="text" name="memberNumber" required value={formData.memberNumber} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="e.g. GYM-001" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="John Doe" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="98XXXXXXXX" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="john@example.com" />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Home Address</label>
                    <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="Street layout, City" />
                 </div>
                 <div className="relative z-[100]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Joined Date</label>
                    <NepaliDatePicker 
                      value={formData.joinedDate ? makeDualDateValueFromAd(new Date(formData.joinedDate)) : null}
                      onChange={(val) => setFormData(prev => ({ ...prev, joinedDate: val?.formatted.ad || '' }))}
                      format="YYYY-MM-DD"
                      showCalendarSystemToggle={true}
                      showLanguageToggle={true}
                      classNames={{
                         input: "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                      }}
                    />
                 </div>
               </div>
            </div>
            </div>

            {/* Health / Emergency */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                 Health & Emergency
              </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Emergency Contact</label>
                    <input type="text" name="emergencyContact" required value={formData.emergencyContact} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="Name - Phone" />
                 </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                    <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="O+, B+, etc." />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Medical Notes / Conditions</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none" placeholder="Any injuries, allergies, or specific goals..."></textarea>
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
