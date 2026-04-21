import React, { useMemo } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { TrendingUp, Users, AlertTriangle, UserPlus, CalendarDays, Activity, ChevronRight, MessageSquare, Plus } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface DashboardProps {
  members: Member[];
  onMemberClick: (id: string) => void;
  onAddMember: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ members, onMemberClick, onAddMember }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentNepaliDate = makeDualDateValueFromAd(new Date());
  const currentBsPrefix = currentNepaliDate?.formatted.bs.substring(0, 7) || '';

  // Active Subscriptions Calculation
  const activeMembersThisMonth = useMemo(() => {
    return members.filter(m => 
      m.subscriptions.some(s => {
          if (!s.isActive) return false;
          return s.startDate <= todayStr && s.endDate >= todayStr;
      })
    );
  }, [members, todayStr]);

  // Revenue Calculation
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

  // New Members Calculation
  const newMembersThisMonth = useMemo(() => {
     if (!currentBsPrefix) return 0;
     return members.filter(m => {
        if (m.isDeleted) return false;
        const joinedVal = makeDualDateValueFromAd(new Date(m.joinedDate));
        return joinedVal?.formatted.bs.substring(0, 7) === currentBsPrefix;
     }).length;
  }, [members, currentBsPrefix]);

  // Upcoming Expirations (Next 7 Days ONLY, strictly NO EXPIRED MEMBERS)
  const expiringSoon = useMemo(() => {
      const expiringList: { member: Member, sub: Subscription, daysLeft: number }[] = [];
      members.forEach(m => {
          if (m.isDeleted) return;
          m.subscriptions.forEach(s => {
              if (!s.isActive) return;
              const endDate = new Date(s.endDate);
              const todayDate = new Date();
              const diffTime = endDate.getTime() - todayDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              // Only 0 to 7 days in the future
              if (diffDays >= 0 && diffDays <= 7) {
                 expiringList.push({ member: m, sub: s, daysLeft: diffDays });
              }
          });
      });
      return expiringList.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 5); // Limit to top 5
  }, [members]);

  // Recent Signups (Last 5 members)
  const recentMembers = useMemo(() => {
      return [...members]
        .filter(m => !m.isDeleted)
        .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
        .slice(0, 5);
  }, [members]);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to Clarity Gym! 👋</h1>
              <p className="text-slate-300 font-medium text-lg max-w-xl">Here is what's happening at your gym today. You have {expiringSoon.length} members expiring in the next 7 days.</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onAddMember} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/25 transition-all flex items-center gap-2">
                 <Plus className="w-5 h-5" /> New Member
              </button>
            </div>
         </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Revenue This Month</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">NPR {totalRevenueThisMonth.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">New Members</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{newMembersThisMonth}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Members</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{activeMembersThisMonth.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl group-hover:bg-slate-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Members</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{members.filter(m => !m.isDeleted).length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Expiring Soon Widget */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">Expiring Soon</h3>
                      <p className="text-sm font-medium text-slate-500">Upcoming renewals in 7 days</p>
                   </div>
                </div>
                {expiringSoon.length > 0 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); alert('Preparing to send bulk reminders via Sparrow SMS...'); }}
                    className="text-sm font-bold bg-slate-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Remind All
                  </button>
                )}
             </div>
             
             <div className="space-y-4 flex-1">
                 {expiringSoon.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                           <AlertTriangle className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">All clear!</p>
                        <p className="text-slate-400 text-sm font-medium">No memberships expiring in the next 7 days.</p>
                     </div>
                 ) : (
                     expiringSoon.map((item, idx) => (
                         <div key={`exp-${idx}`} onClick={() => onMemberClick(item.member.id)} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-white transition-all border border-transparent hover:border-slate-200 hover:shadow-sm group">
                             <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-600 shadow-sm">
                                    {item.member.name.charAt(0)}
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">{item.member.name}</h4>
                                     <p className="text-xs font-medium text-slate-500 mt-0.5">{item.member.phone}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                     <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
                                         {item.daysLeft === 0 ? 'Expires Today' : `In ${item.daysLeft} days`}
                                     </span>
                                     <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-1.5 uppercase">{item.sub.planName}</p>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); alert(`Sending reminder to ${item.member.name}...`); }}
                                   className="p-2.5 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm transition-colors opacity-0 group-hover:opacity-100"
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

          {/* Recent Signups Widget */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-800">Recent Signups</h3>
                      <p className="text-sm font-medium text-slate-500">Latest members joining the gym</p>
                   </div>
                </div>
             </div>
             
             <div className="space-y-4 flex-1">
                 {recentMembers.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-500 font-medium">No recent signups.</p>
                     </div>
                 ) : (
                     recentMembers.map((member, idx) => (
                         <div key={`rec-${idx}`} onClick={() => onMemberClick(member.id)} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-white transition-all border border-transparent hover:border-slate-200 hover:shadow-sm group">
                             <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-600 shadow-sm">
                                    {member.name.charAt(0)}
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{member.name}</h4>
                                     <p className="text-xs font-medium text-slate-500 mt-0.5">{member.phone}</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="text-right">
                                     <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">
                                         {member.joinedDate}
                                     </span>
                                     <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-1.5 uppercase">{member.accessLevel}</p>
                                 </div>
                                 <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
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
