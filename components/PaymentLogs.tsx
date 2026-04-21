import React, { useMemo, useState } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { Search, Filter, CreditCard, CheckCircle2, Clock, DollarSign, Download, ChevronRight } from 'lucide-react';

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

        records.push({
          id: s.id,
          member: m,
          sub: s,
          type: isPending ? 'pending' : 'completed',
          amount: amount,
          date: s.startDate
        });
      });
    });
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [members]);

  // Filter records based on search and type
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const matchesSearch = record.member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            record.member.phone.includes(searchTerm);
      const matchesType = filterType === 'all' || record.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allRecords, searchTerm, filterType]);

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

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Collected</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">NPR {privacyMode ? '••••••' : metrics.totalCollected.toLocaleString()}</h3>
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-lg">
            {metrics.completedCount} Completed Payments
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Pending</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">NPR {privacyMode ? '••••••' : metrics.totalPending.toLocaleString()}</h3>
            </div>
          </div>
          <p className="text-sm font-medium text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-lg">
            {metrics.pendingCount} Pending Payments
          </p>
        </div>

        <div className="bg-red-600 rounded-3xl p-6 border border-red-700 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full"></div>
           <div>
             <h3 className="text-xl font-bold mb-1">Financial Report</h3>
             <p className="text-red-200 text-sm font-medium">Export all payment histories as a spreadsheet for your records.</p>
           </div>
           <button onClick={() => alert('Generating Excel report...')} className="mt-4 flex items-center gap-2 bg-white text-red-600 px-5 py-2.5 rounded-xl font-bold hover:bg-red-50 transition-colors self-start shadow-sm">
             <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Transaction Log</h2>
             <p className="text-sm text-slate-500 font-medium">Detailed history of all member subscriptions and payments</p>
           </div>

           <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search members..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
               />
             </div>
             
             <div className="relative">
               <select 
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value as any)}
                 className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
               >
                 <option value="all">All Status</option>
                 <option value="completed">Completed</option>
                 <option value="pending">Pending</option>
               </select>
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Member Details</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Plan & Access</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No payment records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    onClick={() => onMemberClick(record.member.id)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                           {record.member.name.charAt(0)}
                         </div>
                         <div>
                           <div className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">{record.member.name}</div>
                           <div className="text-xs font-medium text-slate-500">{record.member.phone}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{record.sub.planName}</div>
                      <div className="text-xs font-medium text-slate-400 mt-0.5">{record.member.accessLevel || 'Gym'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{record.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">NPR {privacyMode ? '••••' : record.amount.toLocaleString()}</div>
                      {record.sub.payment.type === PaymentType.SPLIT && (
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Split Payment</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                         {record.type === 'completed' ? (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                             <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
                             <CreditCard className="w-3.5 h-3.5" /> Pending
                           </span>
                         )}
                         <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PaymentLogs;
