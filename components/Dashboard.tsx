import React, { useMemo } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { TrendingUp, Users, UserPlus, CalendarDays, Activity, ChevronRight, PieChart, Plus, CreditCard, Award, Dumbbell } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface DashboardProps {
  members: Member[];
  onMemberClick: (id: string) => void;
  onAddMember: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ members, onMemberClick, onAddMember }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentNepaliDate = useMemo(() => makeDualDateValueFromAd(new Date()), []);
  const currentYear = currentNepaliDate?.bs.year || 2081;
  const currentMonthNum = currentNepaliDate?.bs.month || 1;

  // Generate an array of the last 12 months in YYYY-MM format
  const monthOptions = useMemo(() => {
     const options = [];
     let y = currentYear;
     let m = currentMonthNum;
     const monthNames = ["", "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
     
     for (let i = 0; i < 12; i++) {
        const monthStr = m.toString().padStart(2, '0');
        options.push({
           value: `${y}-${monthStr}`,
           label: `${monthNames[m]} ${y}`
        });
        m--;
        if (m === 0) {
           m = 12;
           y--;
        }
     }
     return options;
  }, [currentYear, currentMonthNum]);

  const [selectedMonthPrefix, setSelectedMonthPrefix] = React.useState<string>(
     `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`
  );

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
    if (!selectedMonthPrefix) return 0;
    return members.reduce((total, m) => {
        if (m.isDeleted) return total;
        const revenue = m.subscriptions.reduce((acc, s) => {
             const subVal = makeDualDateValueFromAd(new Date(s.startDate));
             if (subVal?.formatted.bs.substring(0, 7) !== selectedMonthPrefix) return acc;

             let paid = 0;
             if (s.payment.type === PaymentType.FULL) {
                 // Full payment: count total if either flag is true
                 if (s.payment.depositPaid || s.payment.remainingPaid) paid = s.payment.totalAmount;
             } else {
                 // Split payment: count deposit + remaining separately
                 if (s.payment.depositPaid) paid += s.payment.depositAmount || 0;
                 if (s.payment.remainingPaid) paid += (s.payment.totalAmount - (s.payment.depositAmount || 0));
             }
             return acc + paid;
        }, 0);
        return total + revenue;
    }, 0);
  }, [members, selectedMonthPrefix]);

  // New Members Calculation
  const newMembersThisMonth = useMemo(() => {
     if (!selectedMonthPrefix) return 0;
     return members.filter(m => {
        if (m.isDeleted) return false;
        const joinedVal = makeDualDateValueFromAd(new Date(m.joinedDate));
        return joinedVal?.formatted.bs.substring(0, 7) === selectedMonthPrefix;
     }).length;
  }, [members, selectedMonthPrefix]);

  // Recent Signups (Last 5 members)
  const recentMembers = useMemo(() => {
      return [...members]
        .filter(m => !m.isDeleted)
        .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
        .slice(0, 5);
  }, [members]);

  // Recent Payments (Last 5 subscriptions)
  const recentPayments = useMemo(() => {
      const allSubs: {member: Member, sub: Subscription}[] = [];
      members.forEach(m => {
          if (m.isDeleted) return;
          m.subscriptions.forEach(s => allSubs.push({member: m, sub: s}));
      });
      return allSubs.sort((a, b) => new Date(b.sub.startDate).getTime() - new Date(a.sub.startDate).getTime()).slice(0, 5);
  }, [members]);

  const totalMembersCount = members.filter(m => !m.isDeleted).length;

  // Access Level Distribution
  const accessLevelStats = useMemo(() => {
     const counts: Record<string, number> = { 'Gym': 0, 'Gym + Cardio': 0, 'Gym + Cardio + PT': 0 };
     members.filter(m => !m.isDeleted).forEach(m => {
        const lvl = m.accessLevel || 'Gym';
        counts[lvl] = (counts[lvl] || 0) + 1;
     });
     return Object.entries(counts).map(([name, count]) => ({
         name, 
         count, 
         percentage: totalMembersCount ? Math.round((count / totalMembersCount) * 100) : 0 
     })).sort((a, b) => b.count - a.count);
  }, [members, totalMembersCount]);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
         <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
         <div className="flex items-center gap-3">
             <select 
                value={selectedMonthPrefix}
                onChange={(e) => setSelectedMonthPrefix(e.target.value)}
                className="px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center]"
             >
                {monthOptions.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
             <button onClick={onAddMember} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 text-sm">
                 <Plus className="w-4 h-4" /> New Member
             </button>
         </div>
      </header>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Revenue This Month</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">NPR {totalRevenueThisMonth.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">New Members</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{newMembersThisMonth}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Members</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{activeMembersThisMonth.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl group-hover:bg-slate-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-inner">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Members</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{totalMembersCount}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Membership Distribution Widget */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full lg:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                    <PieChart className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Membership Tiers</h3>
                    <p className="text-sm font-medium text-slate-500">Distribution of packages</p>
                 </div>
              </div>
             
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                 {accessLevelStats.map((stat, idx) => (
                    <div key={idx}>
                       <div className="flex justify-between items-end mb-2">
                           <div className="flex items-center gap-2">
                              {stat.name.includes('PT') ? <Award className="w-4 h-4 text-amber-500" /> : <Dumbbell className="w-4 h-4 text-slate-400" />}
                              <span className="font-bold text-slate-700">{stat.name}</span>
                           </div>
                           <span className="font-bold text-slate-800">{stat.percentage}%</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                           <div 
                              className={`h-3 rounded-full transition-all duration-1000 ${
                                 stat.name.includes('PT') ? 'bg-amber-500' : stat.name.includes('Cardio') ? 'bg-indigo-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${stat.percentage}%` }}
                           ></div>
                       </div>
                       <p className="text-xs font-medium text-slate-400 mt-2 text-right">{stat.count} members</p>
                    </div>
                 ))}
              </div>
          </div>

          {/* Recent Payments Widget */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full lg:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CreditCard className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Recent Payments</h3>
                    <p className="text-sm font-medium text-slate-500">Latest transactions</p>
                 </div>
              </div>
             
              <div className="space-y-4 flex-1">
                 {recentPayments.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <p className="text-slate-500 font-medium">No recent payments.</p>
                     </div>
                 ) : (
                     recentPayments.map((item, idx) => {
                         const isFull = item.sub.payment.type === PaymentType.FULL;
                         const amount = isFull ? item.sub.payment.totalAmount : (item.sub.payment.depositAmount || 0);
                         
                         return (
                             <div key={`pay-${idx}`} onClick={() => onMemberClick(item.member.id)} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-white transition-all border border-transparent hover:border-slate-200 hover:shadow-sm group">
                                 <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-slate-600 shadow-sm">
                                        {item.member.name.charAt(0)}
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{item.member.name}</h4>
                                         <p className="text-xs font-medium text-slate-500 mt-0.5">{item.sub.planName}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <div className="text-right">
                                         <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">
                                             NPR {amount.toLocaleString()}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                         );
                     })
                 )}
              </div>
          </div>

          {/* Recent Signups Widget */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col h-full lg:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    <Activity className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Recent Signups</h3>
                    <p className="text-sm font-medium text-slate-500">Latest members joining</p>
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
                                 </div>
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
