import React, { useMemo } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { TrendingUp, Users, UserPlus, CalendarDays, Activity, PieChart, Plus, CreditCard, Award, Dumbbell, ChevronRight } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface DashboardProps {
  members: Member[];
  onMemberClick: (id: string) => void;
  onAddMember: () => void;
  privacyMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ members, onMemberClick, onAddMember, privacyMode }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentNepaliDate = useMemo(() => makeDualDateValueFromAd(new Date()), []);
  const currentYear = currentNepaliDate?.bs.year || 2081;
  const currentMonthNum = currentNepaliDate?.bs.month || 1;

  const monthNames = ["", "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

  const monthOptions = useMemo(() => {
    const options = [];
    let y = currentYear;
    let m = currentMonthNum;
    for (let i = 0; i < 12; i++) {
      const monthStr = m.toString().padStart(2, '0');
      options.push({ value: `${y}-${monthStr}`, label: `${monthNames[m]} ${y}` });
      m--;
      if (m === 0) { m = 12; y--; }
    }
    return options;
  }, [currentYear, currentMonthNum]);

  const [selectedMonthPrefix, setSelectedMonthPrefix] = React.useState<string>(
    `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`
  );

  const selectedMonthLabel = monthOptions.find(o => o.value === selectedMonthPrefix)?.label || '';

  // Active Members
  const activeMembersCount = useMemo(() => {
    return members.filter(m =>
      m.subscriptions.some(s => !s.isActive ? false : s.startDate <= todayStr && s.endDate >= todayStr)
    ).length;
  }, [members, todayStr]);

  // Revenue for selected month
  const totalRevenueThisMonth = useMemo(() => {
    if (!selectedMonthPrefix) return 0;
    return members.reduce((total, m) => {
      if (m.isDeleted) return total;
      const revenue = m.subscriptions.reduce((acc, s) => {
        const subVal = makeDualDateValueFromAd(new Date(s.startDate));
        const subPrefix = subVal ? `${subVal.bs.year}-${subVal.bs.month.toString().padStart(2, '0')}` : '';
        if (subPrefix !== selectedMonthPrefix) return acc;
        let paid = 0;
        if (s.payment.type === PaymentType.FULL) {
          if (s.payment.depositPaid || s.payment.remainingPaid) paid = s.payment.totalAmount;
        } else {
          if (s.payment.depositPaid) paid += s.payment.depositAmount || 0;
          if (s.payment.remainingPaid) paid += (s.payment.totalAmount - (s.payment.depositAmount || 0));
        }
        return acc + paid;
      }, 0);
      return total + revenue;
    }, 0);
  }, [members, selectedMonthPrefix]);

  // New Members for selected month
  const newMembersThisMonth = useMemo(() => {
    if (!selectedMonthPrefix) return 0;
    return members.filter(m => {
      if (m.isDeleted) return false;
      const joinedVal = makeDualDateValueFromAd(new Date(m.joinedDate));
      const joinedPrefix = joinedVal ? `${joinedVal.bs.year}-${joinedVal.bs.month.toString().padStart(2, '0')}` : '';
      return joinedPrefix === selectedMonthPrefix;
    }).length;
  }, [members, selectedMonthPrefix]);

  const totalMembersCount = members.filter(m => !m.isDeleted).length;

  // Recent Payments
  const recentPayments = useMemo(() => {
    const allSubs: { member: Member; sub: Subscription }[] = [];
    members.forEach(m => {
      if (m.isDeleted) return;
      m.subscriptions.forEach(s => allSubs.push({ member: m, sub: s }));
    });
    return allSubs
      .sort((a, b) => new Date(b.sub.startDate).getTime() - new Date(a.sub.startDate).getTime())
      .slice(0, 6);
  }, [members]);

  // Recent Signups
  const recentMembers = useMemo(() => {
    return [...members]
      .filter(m => !m.isDeleted)
      .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
      .slice(0, 5);
  }, [members]);

  // Tier distribution
  const accessLevelStats = useMemo(() => {
    const counts: Record<string, number> = { 'Gym': 0, 'Gym + Cardio': 0, 'Gym + Cardio + PT': 0 };
    members.filter(m => !m.isDeleted).forEach(m => {
      const lvl = m.accessLevel || 'Gym';
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name, count,
      percentage: totalMembersCount ? Math.round((count / totalMembersCount) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [members, totalMembersCount]);

  const tierColor = (name: string) =>
    name.includes('PT') ? { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' }
    : name.includes('Cardio') ? { bar: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700' }
    : { bar: 'bg-sky-400', badge: 'bg-sky-50 text-sky-700' };

  return (
    <div className="max-w-[1400px] mx-auto pb-16 space-y-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Overview for <span className="text-slate-600 font-semibold">{selectedMonthLabel}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedMonthPrefix}
              onChange={e => setSelectedMonthPrefix(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 cursor-pointer"
            >
              {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={onAddMember}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm shadow-red-200 transition-all"
          >
            <Plus className="w-4 h-4" /> New Member
          </button>
        </div>
      </div>

      {/* ── Hero Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue — Primary card, visually dominant */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-red-500/20 rounded-full blur-3xl" />
          <div className="absolute -right-2 -bottom-6 w-28 h-28 bg-violet-500/20 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Revenue This Month</span>
            </div>
            <p className="text-4xl font-black tracking-tight text-white mb-1">
              NPR <span className="tabular-nums">{privacyMode ? '••••••' : totalRevenueThisMonth.toLocaleString()}</span>
            </p>
            <p className="text-slate-500 text-xs font-medium">{selectedMonthLabel} · Collected</p>
          </div>
        </div>

        {/* New Members */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">New Members</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tabular-nums">{newMembersThisMonth}</p>
          <p className="text-slate-400 text-xs font-medium mt-1">Joined this month</p>
        </div>

        {/* Active Members */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-sky-500" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Now</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tabular-nums">{activeMembersCount}</p>
          <p className="text-slate-400 text-xs font-medium mt-1">of {totalMembersCount} total members</p>
        </div>

      </div>

      {/* ── Lower Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Payments — takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Payments</h2>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Latest transactions recorded</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {recentPayments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-medium">No payments yet.</div>
            ) : recentPayments.map((item, idx) => {
              const isFull = item.sub.payment.type === PaymentType.FULL;
              const amount = isFull ? item.sub.payment.totalAmount : (item.sub.payment.depositAmount || 0);
              return (
                <div
                  key={idx}
                  onClick={() => onMemberClick(item.member.id)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                      {item.member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">{item.member.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{item.sub.planName} · {item.sub.startDate}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                    NPR {privacyMode ? '••••' : amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column — stacked */}
        <div className="flex flex-col gap-6">

          {/* Membership Tiers */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Membership Tiers</h2>
                <p className="text-slate-400 text-xs font-medium mt-0.5">Package breakdown</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <div className="space-y-5">
              {accessLevelStats.map((stat, idx) => {
                const colors = tierColor(stat.name);
                const Icon = stat.name.includes('PT') ? Award : Dumbbell;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{stat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors.badge}`}>{stat.count}</span>
                        <span className="text-xs font-bold text-slate-400 w-8 text-right">{stat.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-2 rounded-full ${colors.bar} transition-all duration-700`} style={{ width: `${stat.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Signups */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1">
            <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Signups</h2>
                <p className="text-slate-400 text-xs font-medium mt-0.5">Latest members</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-sky-500" />
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {recentMembers.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm font-medium">No members yet.</div>
              ) : recentMembers.map((member, idx) => (
                <div
                  key={idx}
                  onClick={() => onMemberClick(member.id)}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{member.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{member.joinedDate}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
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
