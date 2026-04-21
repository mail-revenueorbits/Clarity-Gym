import React, { useMemo } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { TrendingUp, Users, AlertTriangle, UserMinus, ShieldAlert, CreditCard, MessageSquare, UserPlus } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface DashboardProps {
  members: Member[];
  onMemberClick: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ members, onMemberClick }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentNepaliDate = makeDualDateValueFromAd(new Date());
  const currentBsPrefix = currentNepaliDate?.formatted.bs.substring(0, 7) || ''; // e.g. "2081-01"

  // Active Subscriptions Calculation
  const activeMembersThisMonth = useMemo(() => {
    return members.filter(m => 
      m.subscriptions.some(s => {
          if (!s.isActive) return false;
          // Sub is active if start date is before now and end date is after now
          return s.startDate <= todayStr && s.endDate >= todayStr;
      })
    );
  }, [members, todayStr]);

  // Revenue calculation — total collected from subscriptions started this Nepali Month
  const totalRevenueThisMonth = useMemo(() => {
    if (!currentBsPrefix) return 0;
    return members.reduce((total, m) => {
        if (m.isDeleted) return total;
        const revenue = m.subscriptions.reduce((acc, s) => {
             const subVal = makeDualDateValueFromAd(new Date(s.startDate));
             if (subVal?.formatted.bs.substring(0, 7) !== currentBsPrefix) return acc;

             let paid = 0;
             if (s.payment.remainingPaid) paid = s.payment.totalAmount;
             else if (s.payment.type === PaymentType.SPLIT && s.payment.depositPaid) paid = s.payment.depositAmount || 0;
             return acc + paid;
        }, 0);
        return total + revenue;
    }, 0);
  }, [members, currentBsPrefix]);

  // New Members this Nepali Month
  const newMembersThisMonth = useMemo(() => {
     if (!currentBsPrefix) return 0;
     return members.filter(m => {
        if (m.isDeleted) return false;
        const joinedVal = makeDualDateValueFromAd(new Date(m.joinedDate));
        return joinedVal?.formatted.bs.substring(0, 7) === currentBsPrefix;
     }).length;
  }, [members, currentBsPrefix]);

  // Expiring soon or recently expired
  const attentionNeeded = useMemo(() => {
      const expiringList: { member: Member, sub: Subscription, daysLeft: number }[] = [];
      members.forEach(m => {
          if (m.isDeleted) return;
          m.subscriptions.forEach(s => {
              if (!s.isActive) return;
              const endDate = new Date(s.endDate);
              const todayDate = new Date();
              const diffTime = endDate.getTime() - todayDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              // If it expired in the last 14 days OR expires in the next 7 days
              if (diffDays <= 7 && diffDays >= -14) {
                 expiringList.push({ member: m, sub: s, daysLeft: diffDays });
              }
          });
      });
      return expiringList.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [members]);


  const StatCard = ({ label, value, icon: Icon, colorClass, subtitle }: { label: string, value: string | number, icon: any, colorClass: string, subtitle: string }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between">
       <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          <p className="text-slate-400 text-sm font-medium mt-2">{subtitle}</p>
       </div>
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 shrink-0`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
       </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          label="Total Revenue" 
          value={`NPR ${totalRevenueThisMonth.toLocaleString()}`} 
          subtitle="Collected this Nepali month"
          icon={TrendingUp} 
          colorClass="bg-emerald-500 text-emerald-600" 
        />
        <StatCard 
          label="New Members" 
          value={newMembersThisMonth} 
          subtitle="Joined this Nepali month"
          icon={UserPlus} 
          colorClass="bg-purple-500 text-purple-600" 
        />
        <StatCard 
          label="Active Members" 
          value={activeMembersThisMonth.length} 
          subtitle="Currently enrolled members"
          icon={Users} 
          colorClass="bg-blue-500 text-blue-600" 
        />
        <StatCard 
          label="Total Members" 
          value={members.filter(m => !m.isDeleted).length} 
          subtitle="In database"
          icon={UserMinus} 
          colorClass="bg-slate-500 text-slate-600" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
          {/* Action Needed: Expiring */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800">Expiring Memberships</h3>
                </div>
                {attentionNeeded.length > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); alert('Preparing to send bulk reminders via Sparrow SMS...'); }}
                    className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Remind All
                  </button>
                )}
             </div>
             
             <div className="space-y-4">
                 {attentionNeeded.length === 0 ? (
                     <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-500 font-medium">No memberships expiring soon.</div>
                 ) : (
                     attentionNeeded.map((item, idx) => (
                         <div key={idx} onClick={() => onMemberClick(item.member.id)} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
                             <div className="flex items-center gap-4">
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">{item.member.name}</h4>
                                     <p className="text-sm font-medium text-slate-500">{item.member.phone}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <span className={`px-3 py-1 rounded-lg text-xs font-bold ${item.daysLeft < 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                         {item.daysLeft < 0 ? `Expired ${Math.abs(item.daysLeft)} days ago` : `Expires in ${item.daysLeft} days`}
                                     </span>
                                     <p className="text-xs text-slate-400 font-medium mt-1 uppercase">{item.sub.planName}</p>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); alert(`Sending reminder to ${item.member.name}...`); }}
                                   className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-100 shadow-sm transition-colors"
                                   title="Send Reminder"
                                 >
                                   <MessageSquare className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                     ))
                 )}
             </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;
