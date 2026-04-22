import React, { useMemo } from 'react';
import { Member, Subscription, PaymentType, Expense, InventorySale } from '../types';
import { Users, UserPlus, CreditCard, AlertCircle, CalendarDays, Activity, MessageSquare, CheckCircle2, AlertTriangle, IndianRupee } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface DashboardProps {
  members: Member[];
  expenses: Expense[];
  inventorySales: InventorySale[];
  onMemberClick: (id: string) => void;
  onAddMember: () => void;
  privacyMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ members, expenses, inventorySales, onMemberClick, onAddMember, privacyMode }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);
  const in3DaysStr = in3Days.toISOString().split('T')[0];

  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString().split('T')[0];

  const currentMonthPrefix = todayStr.substring(0, 7);

  // 1. Shift & Cash Management: Today's Collection
  const todaysCollection = useMemo(() => {
    let total = 0;
    // Subscriptions paid today (assuming startDate = payment date for now)
    members.forEach(m => {
      if (m.isDeleted) return;
      m.subscriptions.forEach(s => {
        if (s.startDate === todayStr) {
          if (s.payment.type === PaymentType.FULL && (s.payment.depositPaid || s.payment.remainingPaid)) {
            total += s.payment.totalAmount;
          } else if (s.payment.type === PaymentType.SPLIT) {
             if (s.payment.depositPaid) total += (s.payment.depositAmount || 0);
             if (s.payment.remainingPaid) total += (s.payment.totalAmount - (s.payment.depositAmount || 0));
          }
        }
      });
    });
    // Inventory sales today
    inventorySales.forEach(sale => {
      if (sale.date === todayStr) total += sale.totalAmount;
    });
    return total;
  }, [members, inventorySales, todayStr]);

  // 2. Pending Dues
  const pendingDues = useMemo(() => {
    const list: { member: Member, sub: Subscription, amountDue: number }[] = [];
    members.forEach(m => {
      if (m.isDeleted) return;
      m.subscriptions.forEach(s => {
        if (!s.payment.remainingPaid && !(s.payment.type === PaymentType.FULL && s.payment.remainingPaid)) {
           let amountDue = s.payment.totalAmount;
           if (s.payment.type === PaymentType.SPLIT && s.payment.depositPaid) {
             amountDue -= (s.payment.depositAmount || 0);
           }
           if (amountDue > 0) list.push({ member: m, sub: s, amountDue });
        }
      });
    });
    return list.sort((a, b) => b.amountDue - a.amountDue);
  }, [members]);

  // 3. Member Retention: Expiring in 3 Days
  const expiringSoon = useMemo(() => {
    return members.map(m => {
      if (m.isDeleted) return null;
      const activeSubs = m.subscriptions.filter(s => s.isActive && s.endDate >= todayStr && s.endDate <= in3DaysStr);
      if (activeSubs.length > 0) {
         activeSubs.sort((a,b) => a.endDate.localeCompare(b.endDate));
         return { member: m, sub: activeSubs[0] };
      }
      return null;
    }).filter(Boolean) as { member: Member, sub: Subscription }[];
  }, [members, todayStr, in3DaysStr]);

  // 4. Member Retention: Expired This Week
  const expiredThisWeek = useMemo(() => {
    return members.map(m => {
      if (m.isDeleted) return null;
      // Get the most recent sub
      const subs = [...m.subscriptions].sort((a,b) => b.endDate.localeCompare(a.endDate));
      if (subs.length === 0) return null;
      const latestSub = subs[0];
      if (latestSub.endDate >= lastWeekStr && latestSub.endDate < todayStr) {
         return { member: m, sub: latestSub };
      }
      return null;
    }).filter(Boolean) as { member: Member, sub: Subscription }[];
  }, [members, todayStr, lastWeekStr]);

  // 5. High-Level Motivation
  const activeMembersCount = members.filter(m => !m.isDeleted && m.subscriptions.some(s => s.isActive && s.endDate >= todayStr)).length;
  const totalMembersCount = members.filter(m => !m.isDeleted).length;
  
  const newSignupsThisMonth = members.filter(m => !m.isDeleted && m.joinedDate.startsWith(currentMonthPrefix)).length;

  return (
    <div className="max-w-[1400px] mx-auto pb-16 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Front Desk</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">Today's Control Center & Action Items</p>
        </div>
      </div>

      {/* Top Bar: Key Front-Desk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        
        {/* Today's Collection */}
        <div className="bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden group border border-slate-800 shadow-xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl transition-colors"></div>
          <div className="relative z-10 flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
               <IndianRupee className="w-5 h-5 md:w-6 md:h-6" />
             </div>
             <div>
               <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Today's Collection</p>
               <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">NPR {privacyMode ? '••••••' : todaysCollection.toLocaleString()}</h3>
             </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-400 relative z-10">Cash in drawer & digital collected today</p>
        </div>

        {/* Active Members */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
               <Users className="w-5 h-5 md:w-6 md:h-6" />
             </div>
             <div>
               <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Active Members</p>
               <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{activeMembersCount}</h3>
             </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-500">Out of {totalMembersCount} total members</p>
        </div>

        {/* New Signups */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-violet-50 flex items-center justify-center text-violet-500">
               <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
             </div>
             <div>
               <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">New Signups</p>
               <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{newSignupsThisMonth}</h3>
             </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-500">Joined this month</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">

        {/* Left Column: Action Items */}
        <div className="flex flex-col gap-6">
           
           {/* Pending Dues */}
           <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
             <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between bg-red-50/30">
               <div>
                 <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-red-600" /> Pending Dues
                 </h2>
                 <p className="text-red-500 text-xs font-medium mt-0.5">Members owing money. Stop them at the desk!</p>
               </div>
             </div>
             <div className="divide-y divide-slate-50">
               {pendingDues.length === 0 ? (
                 <div className="py-12 text-center text-slate-400 text-sm font-medium">All dues cleared! Great job.</div>
               ) : pendingDues.map((item, idx) => (
                 <div key={idx} onClick={() => onMemberClick(item.member.id)} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-sm font-bold text-red-600 shrink-0">
                        {item.member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors">{item.member.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.member.phone}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                            Due: NPR {privacyMode ? '••••' : item.amountDue.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.sub.planName}</span>
                       </div>
                       <button onClick={(e) => { e.stopPropagation(); alert(`Sent SMS reminder to ${item.member.name}`); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Send SMS Reminder">
                         <MessageSquare className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           </div>

        </div>

        {/* Right Column: Retention & Follow-ups */}
        <div className="flex flex-col gap-6">

           {/* Expiring Soon */}
           <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
             <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between bg-amber-50/30">
               <div>
                 <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                   <CalendarDays className="w-5 h-5 text-amber-500" /> Expiring Soon (3 Days)
                 </h2>
                 <p className="text-amber-600 text-xs font-medium mt-0.5">Remind them to renew when they walk in</p>
               </div>
             </div>
             <div className="divide-y divide-slate-50">
               {expiringSoon.length === 0 ? (
                 <div className="py-12 text-center text-slate-400 text-sm font-medium">No one expiring in the next 3 days.</div>
               ) : expiringSoon.map((item, idx) => (
                 <div key={idx} onClick={() => onMemberClick(item.member.id)} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-sm font-bold text-amber-600 shrink-0">
                        {item.member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{item.member.name}</p>
                        <p className="text-xs text-slate-500 font-medium">Ends on {item.sub.endDate ? makeDualDateValueFromAd(new Date(item.sub.endDate)).formatted.bs : '—'}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); alert(`Sent renewal reminder to ${item.member.name}`); }} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Send SMS Reminder">
                       <MessageSquare className="w-4 h-4" />
                    </button>
                 </div>
               ))}
             </div>
           </div>

           {/* Expired This Week */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div>
                 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <AlertCircle className="w-5 h-5 text-slate-500" /> Expired Recently
                 </h2>
                 <p className="text-slate-500 text-xs font-medium mt-0.5">Packages that ended in the last 7 days</p>
               </div>
             </div>
             <div className="divide-y divide-slate-50">
               {expiredThisWeek.length === 0 ? (
                 <div className="py-12 text-center text-slate-400 text-sm font-medium">No recent expirations. Retention is 100%!</div>
               ) : expiredThisWeek.map((item, idx) => (
                 <div key={idx} onClick={() => onMemberClick(item.member.id)} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                        {item.member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-slate-600 transition-colors">{item.member.name}</p>
                        <p className="text-xs text-red-500 font-medium">Ended {item.sub.endDate ? makeDualDateValueFromAd(new Date(item.sub.endDate)).formatted.bs : '—'}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); alert(`Sent win-back SMS to ${item.member.name}`); }} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" title="Send SMS Win-back">
                       <MessageSquare className="w-3.5 h-3.5" /> SMS
                    </button>
                 </div>
               ))}
             </div>
           </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
