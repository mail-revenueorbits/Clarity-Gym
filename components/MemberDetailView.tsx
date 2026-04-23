import React, { useState, useMemo } from 'react';
import { Member, Subscription, PaymentType, Attendance } from '../types';
import { ArrowLeft, User, Phone, MapPin, Calendar, HeartPulse, Edit2, Plus, CreditCard, Clock, CheckCircle2, Trash2, Bell, MessageSquare, KeyRound, Eye, EyeOff, Save, X, Loader2, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';
import { getFormattedBsDate } from '../utils';
import SubscriptionFormModal from './SubscriptionFormModal';
import { LogEntry } from './Notifications';

interface MemberDetailViewProps {
  member: Member;
  attendance: Attendance[];
  onBack: () => void;
  onEditMember: (member: Member) => void;
  onSaveSubscription: (memberId: string, subscription: Subscription) => void;
  onDeleteMember: (id: string) => void;
  onUpdatePassword: (memberId: string, newPassword: string) => Promise<boolean>;
  notificationLogs?: LogEntry[];
  onImageClick?: (url: string, name: string) => void;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({ member, attendance, onBack, onEditMember, onSaveSubscription, onDeleteMember, onUpdatePassword, notificationLogs = [], onImageClick }) => {
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | undefined>(undefined);

  // Calendar state
  const [calDate, setCalDate] = useState(new Date());

  // Password editing state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState(member.memberPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!tempPassword.trim()) return;
    setIsSavingPassword(true);
    const success = await onUpdatePassword(member.id, tempPassword.trim());
    if (success) {
      setIsEditingPassword(false);
    }
    setIsSavingPassword(false);
  };

  const handleOpenNewSub = () => {
    setEditingSub(undefined);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: Subscription) => {
    setEditingSub(sub);
    setIsSubModalOpen(true);
  };

  const handleSaveSub = (sub: Subscription) => {
    onSaveSubscription(member.id, sub);
    setIsSubModalOpen(false);
  };

  const sortedSubs = [...member.subscriptions].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const todayStr = new Date().toISOString().split('T')[0];

  const getSubStatus = (sub: Subscription) => {
     if (!sub.isActive) return { text: 'Cancelled', class: 'bg-slate-100 text-slate-600' };
     if (sub.endDate < todayStr) return { text: 'Expired', class: 'bg-red-100 text-red-600' };
     return { text: 'Active', class: 'bg-emerald-100 text-emerald-600' };
  };

  const getPaymentStatus = (sub: Subscription) => {
      let paid = 0;
      if (sub.payment.type === PaymentType.FULL) paid = sub.payment.remainingPaid ? sub.payment.totalAmount : 0;
      if (sub.payment.type === PaymentType.SPLIT) {
          if (sub.payment.depositPaid) paid += (sub.payment.depositAmount || 0);
          if (sub.payment.remainingPaid) paid = sub.payment.totalAmount;
      }
      return paid >= sub.payment.totalAmount ? 'Fully Paid' : `Partial (NPR ${paid})`;
  };

  const memberLogs = notificationLogs.filter(log => 
    log.recipientNames.includes(member.name) || log.recipientNames.includes('All Members (Broadcast)')
  ).sort((a, b) => b.timestamp - a.timestamp);

  const calendarData = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = isCurrentMonth ? today.getDate() : -1;

    const attendedDates = new Set(
      attendance.map(a => {
        const d = new Date(a.checkInDate);
        if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
        return -1;
      }).filter(d => d > 0)
    );

    return { year, month, firstDay, daysInMonth, todayDate, attendedDates };
  }, [attendance, calDate]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const changeMonth = (offset: number) => {
    const newDate = new Date(calDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalDate(newDate);
  };

  const thisMonthCount = attendance.filter(a => {
    const d = new Date(a.checkInDate);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-4 md:space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors mb-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full"></div>
             
             <div className="flex justify-between items-start mb-6 relative">
                 <div 
                   className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-sm overflow-hidden border-2 border-white cursor-zoom-in"
                   onClick={() => {
                     if (member.profilePicture) {
                       onImageClick?.(member.profilePicture, member.name);
                     }
                   }}
                 >
                   {member.profilePicture ? (
                     <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover" />
                   ) : (
                     member.name.charAt(0)
                   )}
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => onEditMember(member)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => { if(confirm('Are you sure you want to delete this member?')) onDeleteMember(member.id); }} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                 </div>
             </div>

             <div className="relative">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{member.name}</h1>
                <p className="text-slate-500 font-medium mt-0.5 text-sm">#{member.memberNumber}</p>
             </div>

             <div className="mt-8 space-y-5">
                 {member.gender && <div className="flex items-center gap-3 text-slate-600"><User className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">{member.gender}</span></div>}
                 <div className="flex items-center gap-3 text-slate-600"><Phone className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">{member.phone}</span></div>
                 {member.email && <div className="flex items-center gap-3 text-slate-600"><User className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium truncate">{member.email}</span></div>}
                 {member.dob && <div className="flex items-center gap-3 text-slate-600"><Calendar className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">DOB: {getFormattedBsDate(member.dob)}</span></div>}
                 <div className="flex items-center gap-3 text-slate-600"><Calendar className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">Joined {member.joinedDate ? getFormattedBsDate(member.joinedDate) : '—'}</span></div>
                 {member.accessLevel && <div className="flex items-center gap-3"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase">{member.accessLevel}</span></div>}
              </div>
          </div>

          <div className="bg-red-50 rounded-2xl md:rounded-3xl p-5 md:p-8 border border-red-100 relative overflow-hidden">
             <HeartPulse className="absolute -right-4 -bottom-4 w-32 h-32 text-red-600/10" />
             <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-5 flex items-center gap-2">Emergency & Health</h3>
             <div className="space-y-4 relative">
                <div>
                  <p className="text-xs font-bold text-red-800/60 uppercase tracking-wider mb-1">Emergency Contact 1</p>
                  <p className="font-medium text-red-900">{member.emergencyContact}</p>
                </div>
                {member.emergencyContact2 && <div>
                  <p className="text-xs font-bold text-red-800/60 uppercase tracking-wider mb-1">Emergency Contact 2</p>
                  <p className="font-medium text-red-900">{member.emergencyContact2}</p>
                </div>}
                <div>
                  <p className="text-xs font-bold text-red-800/60 uppercase tracking-wider mb-1">Blood Group</p>
                  <p className="font-medium text-red-900">{member.bloodGroup || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-800/60 uppercase tracking-wider mb-1">Notes</p>
                  <p className="font-medium text-red-900 bg-white/50 p-3 rounded-xl text-sm">{member.notes || 'No medical notes.'}</p>
                </div>
             </div>
          </div>

          {/* Portal Credentials Card */}
          <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-5 md:p-8 border border-slate-200 relative overflow-hidden">
            <KeyRound className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-900/5" />
            
            <div className="flex justify-between items-center mb-6 relative">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Portal Access</h3>
              </div>
              {!isEditingPassword ? (
                <button 
                  onClick={() => {
                    setTempPassword(member.memberPassword || '');
                    setIsEditingPassword(true);
                  }}
                  className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-300"
                  title="Edit Credentials"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={isSavingPassword}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSavingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditingPassword(false)}
                    disabled={isSavingPassword}
                    className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-5 relative">
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Username (Phone)</p>
                <p className="font-bold text-slate-900 font-mono tracking-tight">{member.phone}</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Portal Password</p>
                {isEditingPassword ? (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                      autoFocus
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-slate-900 font-mono text-lg tracking-widest ${!member.memberPassword ? 'italic text-slate-300' : ''}`}>
                      {!member.memberPassword ? 'Not set' : (showPassword ? member.memberPassword : '••••••••')}
                    </p>
                    {member.memberPassword && (
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-1">
                Members use these credentials to log in to the portal at <span className="text-slate-600 font-bold">{window.location.origin}/#/portal</span>
              </p>
            </div>
          </div>
        </div>

        {/* Subscriptions Main Area */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
           <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-5 md:mb-8 border-b border-slate-100 pb-4 md:pb-5">
                 <h2 className="text-base md:text-lg font-bold text-slate-900">Subscription History</h2>
                 <button onClick={handleOpenNewSub} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors whitespace-nowrap text-xs md:text-sm">
                    <Plus className="w-4 h-4" /> Add Log
                 </button>
              </div>

              <div className="space-y-4">
                 {sortedSubs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                       <p className="text-slate-500 font-medium">No subscriptions recorded yet.</p>
                       <button onClick={handleOpenNewSub} className="mt-3 text-red-600 font-bold hover:underline">Add first subscription</button>
                    </div>
                 ) : (
                    sortedSubs.map((sub) => {
                       const status = getSubStatus(sub);
                       const isPaid = getPaymentStatus(sub) === 'Fully Paid';

                       return (
                         <div key={sub.id} className="group relative bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-5 hover:border-red-200 transition-all hover:shadow-lg hover:shadow-slate-200/20">
                            <button onClick={() => handleOpenEditSub(sub)} className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 md:p-2 bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                               <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                            <div className="flex flex-col gap-3 md:flex-row md:gap-6 md:items-center pr-10 md:pr-12">
                               <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                     <h3 className="text-lg font-bold text-slate-800">{sub.planName}</h3>
                                     <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${status.class}`}>{status.text}</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3">
                                     <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{sub.startDate ? getFormattedBsDate(sub.startDate) : '—'} <span className="text-slate-400 mx-1">to</span> {sub.endDate ? getFormattedBsDate(sub.endDate) : '—'}</span>
                                     </div>
                                  </div>
                                  {sub.notes && <p className="mt-3 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg italic">"{sub.notes}"</p>}
                               </div>
                               
                               <div className="w-full md:w-auto md:min-w-[180px] bg-slate-50 rounded-xl p-4 border border-slate-100 shrink-0">
                                   <div className="flex items-center gap-2 mb-2">
                                      <CreditCard className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Log</span>
                                   </div>
                                   <div className="font-bold text-lg text-slate-800 mb-1">NPR {sub.payment.totalAmount.toLocaleString()}</div>
                                   <div className={`text-xs font-bold flex items-center gap-1 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : null} {getPaymentStatus(sub)}
                                   </div>
                               </div>
                            </div>
                         </div>
                       )
                    })
                 )}
              </div>
           </div>

           {/* Communication History */}
           <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm mt-4 md:mt-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                   <Bell className="w-5 h-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-slate-900">Communication History</h2>
                   <p className="text-xs text-slate-500 font-medium">Log of SMS notifications sent to this member</p>
                 </div>
              </div>

              <div className="space-y-3">
                 {memberLogs.length === 0 ? (
                   <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                     <p className="text-slate-400 text-sm font-medium">No notification history found.</p>
                   </div>
                 ) : (
                   memberLogs.map((log) => (
                     <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                            log.type === 'promotion' ? 'bg-purple-100 text-purple-700' :
                            log.type === 'reminder' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                       </div>
                       <p className="text-sm text-slate-700 leading-relaxed">
                         <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                         {log.message}
                       </p>
                       <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent Successfully
                       </div>
                     </div>
                   ))
                 )}
              </div>
            </div>

            {/* Visit History / Attendance Calendar */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 border border-slate-100 shadow-sm mt-4 md:mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Visit History</h2>
                    <p className="text-xs text-slate-500 font-medium">Monthly gym attendance record</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => changeMonth(-1)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-slate-800 min-w-[120px] text-center">
                      {monthNames[calendarData.month]} {calendarData.year}
                    </span>
                    <button 
                      onClick={() => changeMonth(1)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-center px-3 border-l border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Month</p>
                      <p className="text-lg font-black text-slate-800 leading-none">{thisMonthCount}</p>
                    </div>
                    <div className="text-center px-3 border-l border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                      <p className="text-lg font-black text-slate-800 leading-none">{attendance.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-[10px] md:text-xs font-bold text-slate-400 text-center uppercase tracking-widest pb-2">
                    {d}
                  </div>
                ))}
                
                {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square md:h-14"></div>
                ))}

                {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const attended = calendarData.attendedDates.has(day);
                  const isToday = day === calendarData.todayDate;
                  
                  return (
                    <div 
                      key={day} 
                      className={`relative aspect-square md:h-14 rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-sm md:text-base font-bold transition-all ${
                        attended 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105 z-10' 
                          : isToday 
                            ? 'bg-white border-2 border-red-500 text-red-600' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                      {attended && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="w-3 h-3 text-white/50" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-8 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attended</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-red-500"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Missed</span>
                </div>
              </div>
            </div>
          </div>


        <SubscriptionFormModal 
          isOpen={isSubModalOpen} 
          onClose={() => setIsSubModalOpen(false)} 
          onSave={handleSaveSub} 
          existingSubscription={editingSub} 
          member={member}
        />
      </div>
    </div>
  );
};

export default MemberDetailView;
