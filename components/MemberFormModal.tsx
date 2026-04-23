import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { X, UserPlus, FileEdit, Camera, Upload, Loader2, Check } from 'lucide-react';
import { NepaliDatePicker, makeDualDateValueFromAd } from '@etpl/nepali-datepicker';
import Cropper from 'react-easy-crop';

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
    id: '',
    memberNumber: '',
    name: '',
    gender: '',
    phone: '',
    email: '',
    dob: '',
    address: '',
    emergencyContact: '',
    emergencyContact2: '',
    bloodGroup: '',
    accessLevel: 'Gym',
    joinedDate: new Date().toISOString().split('T')[0],
    notes: '',
    profilePicture: '',
    thumbnail: '',
  });
  
  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Only initialize form data when the modal is FIRST opened or when the member to edit changes
  useEffect(() => {
    if (isOpen) {
      if (!initialData) {
        // Reset only if it was previously an edit or if it's genuinely empty
        if (formData.id !== '' || formData.name === '') {
          setFormData({
            id: '',
            memberNumber: generateMemberNumber(existingMembers),
            name: '',
            gender: '',
            phone: '',
            email: '',
            dob: '',
            address: '',
            emergencyContact: '',
            emergencyContact2: '',
            bloodGroup: '',
            accessLevel: 'Gym',
            joinedDate: new Date().toISOString().split('T')[0],
            notes: '',
            profilePicture: '',
            thumbnail: '',
          });
        }
      } else if (formData.id !== initialData.id) {
        // Only load data if we are switching members (or loading for first time)
        setFormData({
          id: initialData.id,
          memberNumber: initialData.memberNumber,
          name: initialData.name,
          gender: initialData.gender || '',
          phone: initialData.phone,
          email: initialData.email || '',
          dob: initialData.dob || '',
          address: initialData.address || '',
          emergencyContact: initialData.emergencyContact || '',
          emergencyContact2: initialData.emergencyContact2 || '',
          bloodGroup: initialData.bloodGroup || '',
          accessLevel: initialData.accessLevel || 'Gym',
          joinedDate: initialData.joinedDate || new Date().toISOString().split('T')[0],
          notes: initialData.notes || '',
          profilePicture: initialData.profilePicture || '',
          thumbnail: initialData.thumbnail || '',
        });
      }
    }
  }, [isOpen, initialData]); 

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<{ full: string, thumb: string }> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    // Create the "Profile" version (800x800)
    canvas.width = 800;
    canvas.height = 800;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      800,
      800
    );
    const full = canvas.toDataURL('image/jpeg', 0.5);

    // Create the "Thumbnail" version (128x128)
    canvas.width = 128;
    canvas.height = 128;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      128,
      128
    );
    const thumb = canvas.toDataURL('image/jpeg', 0.3);

    return { full, thumb };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const { full, thumb } = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setFormData(prev => ({ ...prev, profilePicture: full, thumbnail: thumb }));
      setImageToCrop(null);
    } catch (err) {
      console.error('Image processing failed:', err);
      alert('Failed to process image.');
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

  const inputClass = "w-full px-3 py-2.5 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-colors text-sm";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 md:p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2.5 md:gap-3">
             <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
               {initialData ? <FileEdit className="w-4 h-4 md:w-5 md:h-5"/> : <UserPlus className="w-4 h-4 md:w-5 md:h-5"/>}
             </div>
             <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                  {initialData ? 'Edit Member' : 'New Member'}
                </h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Enter member details below</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8">
          <div className="space-y-6 md:space-y-8">

            {/* ─── Photo & Member No ─── */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
               <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                  <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                    {formData.profilePicture ? (
                      <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-10 h-10 mb-1" />
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">No Photo</span>
                      </div>
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                         <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-red-600" />
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
                 <div className="relative z-[101]">
                    <label className={labelClass}>DOB <span className="text-slate-400 normal-case">(AD: {formData.dob || 'None'})</span></label>
                    <NepaliDatePicker 
                      value={formData.dob ? makeDualDateValueFromAd(new Date(formData.dob)) : null}
                      onChange={(val) => setFormData(prev => ({ ...prev, dob: val?.formatted.ad || '' }))}
                      format="YYYY-MM-DD"
                      showCalendarSystemToggle={true}
                      showLanguageToggle={true}
                      classNames={{ input: inputClass }}
                    />
                 </div>
                 <div className="relative z-[100]">
                    <label className={labelClass}>Joined Date <span className="text-slate-400 normal-case">(AD: {formData.joinedDate})</span></label>
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

      {/* Image Cropper Modal - Fully Contained and Responsive */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[85vh] animate-in zoom-in-95 duration-300">
            {/* Header - Fixed */}
            <div className="px-6 py-4 md:px-8 md:py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-none">Position Photo</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Square Crop</p>
                </div>
              </div>
              <button onClick={() => setImageToCrop(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Cropper Area - Flexible but contained */}
            <div className="relative flex-1 bg-slate-900 min-h-0">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{
                  containerClassName: "bg-slate-900",
                  mediaClassName: "max-w-none",
                  cropAreaClassName: "border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                }}
              />
            </div>

            {/* Controls & Buttons - Fixed at bottom */}
            <div className="px-6 py-6 md:px-8 md:py-6 border-t border-slate-100 bg-white space-y-5 flex-shrink-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2">Scale</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setImageToCrop(null)} 
                  className="flex-1 px-6 py-3.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropSave} 
                  disabled={isProcessing}
                  className="flex-[1.5] flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 text-sm"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Done</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberFormModal;
