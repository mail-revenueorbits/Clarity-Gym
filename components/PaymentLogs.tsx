import React, { useMemo, useState } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { Search, Filter, CreditCard, CheckCircle2, Clock, DollarSign, Download, ChevronRight, MessageSquare, Calendar } from 'lucide-react';
import { makeDualDateValueFromAd, getNepaliToday } from '@etpl/nepali-datepicker';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

interface PaymentLogsProps {
  members: Member[];
  onMemberClick: (id: string) => void;
  privacyMode: boolean;
}

type PaymentRecord = {
  id: string;
  member: Member;
  sub: Subscription;
  type: 'pending' | 'completed';
  amount: number;
  date: string;
};

const PaymentLogs: React.FC<PaymentLogsProps> = ({ members, onMemberClick, privacyMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed'>('all');
  
  const todayBS = getNepaliToday();
  const [selectedMonth, setSelectedMonth] = useState(todayBS.month); // 1-12
  const [selectedYear, setSelectedYear] = useState(todayBS.year);

  // Generate all payment records
  const allRecords = useMemo(() => {
    const records: PaymentRecord[] = [];
    members.forEach(m => {
      if (m.isDeleted) return;
      m.subscriptions.forEach(s => {
        const isPending = !s.payment.remainingPaid && !(s.payment.type === PaymentType.FULL && s.payment.remainingPaid);
        let amount = s.payment.totalAmount;

        if (isPending) {
          let paid = 0;
          if (s.payment.type === PaymentType.SPLIT && s.payment.depositPaid) {
             paid = s.payment.depositAmount || 0;
          }
          amount = s.payment.totalAmount - paid;
        }

        const dualDate = makeDualDateValueFromAd(new Date(s.startDate));
        
        records.push({
          id: s.id,
          member: m,
          sub: s,
          type: isPending ? 'pending' : 'completed',
          amount: amount,
          date: s.startDate,
          // @ts-ignore (adding bsDate for easier display)
          bsDate: dualDate.formatted.bs
        });
      });
    });
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [members]);

  // Filter records based on search, type AND Nepali Month
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const matchesSearch = record.member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            record.member.phone.includes(searchTerm);
      const matchesType = filterType === 'all' || record.type === filterType;
      
      // @ts-ignore
      const [year, month] = record.bsDate.split('/').map(Number);
      const matchesMonth = month === selectedMonth && year === selectedYear;

      return matchesSearch && matchesType && matchesMonth;
    });
  }, [allRecords, searchTerm, filterType, selectedMonth, selectedYear]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    return allRecords.reduce((acc, curr) => {
      if (curr.type === 'completed') {
        acc.totalCollected += curr.amount;
        acc.completedCount++;
      } else {
        acc.totalPending += curr.amount;
        acc.pendingCount++;
      }
      return acc;
    }, { totalCollected: 0, totalPending: 0, completedCount: 0, pendingCount: 0 });
  }, [allRecords]);

  // CSV Export
  const handleExportCSV = () => {
    const rows = [['Member', 'Phone', 'Plan', 'Access Level', 'Date', 'Amount', 'Type', 'Status', 'Method']];
    allRecords.forEach(r => {
      rows.push([
        r.member.name,
        r.member.phone,
        r.sub.planName,
        r.member.accessLevel || 'Gym',
        r.date,
        r.amount.toString(),
        r.sub.payment.type,
        r.type,
        r.sub.payment.method || 'Cash'
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClarityGym_Payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Payment Logs</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
            <span className="text-slate-600 font-bold">{allRecords.length}</span> transactions recorded
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              {NEPALI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer border-l border-slate-200 pl-2 ml-1"
            >
              {[2080, 2081, 2082, 2083, 2084, 2085].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Collected</p>
            <p className="text-base md:text-xl font-black text-slate-900 tracking-tight">NPR {privacyMode ? '••••••' : metrics.totalCollected.toLocaleString()}</p>
            <p className="text-[10px] md:text-xs font-medium text-emerald-600">{metrics.completedCount} completed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">Pending</p>
            <p className="text-base md:text-xl font-black text-slate-900 tracking-tight">NPR {privacyMode ? '••••••' : metrics.totalPending.toLocaleString()}</p>
            <p className="text-[10px] md:text-xs font-medium text-amber-600">{metrics.pendingCount} outstanding</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
           <div className="flex gap-1.5">
              {(['all', 'completed', 'pending'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${filterType === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
                  {f === 'all' ? `All (${filteredRecords.length})` : f === 'completed' ? `Completed (${filteredRecords.filter(r => r.type === 'completed').length})` : `Pending (${filteredRecords.filter(r => r.type === 'pending').length})`}
                </button>
              ))}
           </div>
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by name or phone..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-red-500 transition-colors"
             />
           </div>
        </div>

        {/* Table Header - Desktop only */}
        <div className="hidden md:grid grid-cols-[1fr_110px_100px_120px_140px] items-center px-5 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Member</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Plan</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Date</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Amount</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Status</span>
        </div>

        {/* Rows */}
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            No payment records found matching your filters.
          </div>
        ) : (
          <div>
            {filteredRecords.map((record, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={record.id}
                  onClick={() => onMemberClick(record.member.id)}
                  className={`cursor-pointer transition-colors group ${isEven ? 'bg-white' : 'bg-gray-50/70'} hover:bg-red-50`}
                >
                  {/* Mobile card layout */}
                  <div className="md:hidden flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {record.member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{record.member.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{record.sub.planName} · {/* @ts-ignore */}{record.bsDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">NPR {privacyMode ? '••••' : record.amount.toLocaleString()}</p>
                        {record.type === 'completed' ? (
                          <span className="text-[10px] font-bold text-emerald-600">Paid</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600">Due</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>

                  {/* Desktop grid layout */}
                  <div className="hidden md:grid grid-cols-[1fr_110px_100px_120px_140px] items-center px-5 py-3.5">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        {record.member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors truncate">{record.member.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{record.member.phone}</p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-600 truncate">{record.sub.planName}</p>
                      {record.sub.payment.type === PaymentType.SPLIT && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Split</p>
                      )}
                    </div>
                    {/* @ts-ignore */}
                    <span className="text-xs text-slate-500 font-bold">{record.bsDate}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">NPR {privacyMode ? '••••' : record.amount.toLocaleString()}</p>
                      {record.sub.payment.method && record.type === 'completed' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{record.sub.payment.method}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {record.type === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); alert(`Sent SMS reminder to ${record.member.name} for NPR ${record.amount}`); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Send SMS Reminder">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-bold">
                            <CreditCard className="w-3 h-3" /> Due
                          </span>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLogs;
