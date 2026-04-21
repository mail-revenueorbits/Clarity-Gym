import React, { useState } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { ArrowLeft, User, Phone, MapPin, Calendar, HeartPulse, Edit2, Plus, CreditCard, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import SubscriptionFormModal from './SubscriptionFormModal';

interface MemberDetailViewProps {
  member: Member;
  onBack: () => void;
  onEditMember: (member: Member) => void;
  onSaveSubscription: (memberId: string, subscription: Subscription) => void;
  onDeleteMember: (id: string) => void;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({ member, onBack, onEditMember, onSaveSubscription, onDeleteMember }) => {
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | undefined>(undefined);

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

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors mb-2">
        <ArrowLeft className="w-5 h-5" /> Back to Members
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full"></div>
             
             <div className="flex justify-between items-start mb-6 relative">
                 <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-sm overflow-hidden border-2 border-white">
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
                <h1 className="text-2xl font-bold text-slate-800 leading-tight">{member.name}</h1>
                <p className="text-slate-500 font-medium mt-1">#{member.memberNumber}</p>
             </div>

             <div className="mt-8 space-y-5">
                 {member.gender && <div className="flex items-center gap-3 text-slate-600"><User className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">{member.gender}</span></div>}
                 <div className="flex items-center gap-3 text-slate-600"><Phone className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">{member.phone}</span></div>
                 {member.email && <div className="flex items-center gap-3 text-slate-600"><User className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium truncate">{member.email}</span></div>}
                 {member.dob && <div className="flex items-center gap-3 text-slate-600"><Calendar className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">DOB: {member.dob}</span></div>}
                 <div className="flex items-center gap-3 text-slate-600"><Calendar className="w-5 h-5 text-slate-400 shrink-0"/> <span className="font-medium">Joined {member.joinedDate}</span></div>
                 {member.accessLevel && <div className="flex items-center gap-3"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase">{member.accessLevel}</span></div>}
              </div>
          </div>

          <div className="bg-red-50 rounded-3xl p-6 md:p-8 border border-red-100 relative overflow-hidden">
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
        </div>

        {/* Subscriptions Main Area */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
                 <h2 className="text-xl font-bold text-slate-800 tracking-tight">Subscription History</h2>
                 <button onClick={handleOpenNewSub} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors whitespace-nowrap">
                    <Plus className="w-5 h-5" /> Add Log
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
                         <div key={sub.id} className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-red-200 transition-all hover:shadow-lg hover:shadow-slate-200/20">
                            <button onClick={() => handleOpenEditSub(sub)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                               <Edit2 className="w-4 h-4" />
                            </button>
                            <div className="flex flex-col md:flex-row gap-6 md:items-center pr-12">
                               <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                     <h3 className="text-lg font-bold text-slate-800">{sub.planName}</h3>
                                     <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${status.class}`}>{status.text}</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3">
                                     <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{sub.startDate} <span className="text-slate-400 mx-1">to</span> {sub.endDate}</span>
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
  );
};

export default MemberDetailView;
