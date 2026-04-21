import React, { useMemo } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { CreditCard, CheckCircle } from 'lucide-react';

interface PaymentLogsProps {
  members: Member[];
  onMemberClick: (id: string) => void;
}

const PaymentLogs: React.FC<PaymentLogsProps> = ({ members, onMemberClick }) => {
  const pendingPayments = useMemo(() => {
      const pending: { member: Member, sub: Subscription, remaining: number }[] = [];
      members.forEach(m => {
          if (m.isDeleted) return;
          m.subscriptions.forEach(s => {
              if (!s.isActive) return;
              if (!s.payment.remainingPaid) {
                  let paid = 0;
                  if (s.payment.type === PaymentType.SPLIT && s.payment.depositPaid) {
                      paid = s.payment.depositAmount || 0;
                  }
                  pending.push({ member: m, sub: s, remaining: s.payment.totalAmount - paid });
              }
          });
      });
      return pending;
  }, [members]);

  const completedPayments = useMemo(() => {
      const completed: { member: Member, sub: Subscription, total: number }[] = [];
      members.forEach(m => {
          if (m.isDeleted) return;
          m.subscriptions.forEach(s => {
              if (s.payment.remainingPaid || (s.payment.type === PaymentType.FULL && s.payment.depositPaid)) {
                  completed.push({ member: m, sub: s, total: s.payment.totalAmount });
              }
          });
      });
      return completed.sort((a, b) => b.sub.createdAt - a.sub.createdAt);
  }, [members]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Payments */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                   <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Pending Payments</h3>
             </div>
             
             <div className="space-y-4">
                 {pendingPayments.length === 0 ? (
                     <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-500 font-medium">No pending payments.</div>
                 ) : (
                     pendingPayments.map((item, idx) => (
                         <div key={`pending-${idx}`} onClick={() => onMemberClick(item.member.id)} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
                             <div>
                                 <h4 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{item.member.name}</h4>
                                 <p className="text-sm font-medium text-slate-500">{item.member.phone}</p>
                             </div>
                             <div className="text-right">
                                 <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                                     NPR {item.remaining.toLocaleString()}
                                 </span>
                                 <p className="text-xs text-slate-400 font-medium mt-1 uppercase">{item.sub.planName}</p>
                             </div>
                         </div>
                     ))
                 )}
             </div>
          </div>

          {/* Completed Payments */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Completed Payments</h3>
             </div>
             
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                 {completedPayments.length === 0 ? (
                     <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-500 font-medium">No completed payments yet.</div>
                 ) : (
                     completedPayments.map((item, idx) => (
                         <div key={`completed-${idx}`} onClick={() => onMemberClick(item.member.id)} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
                             <div>
                                 <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{item.member.name}</h4>
                                 <p className="text-sm font-medium text-slate-500">{item.member.phone}</p>
                             </div>
                             <div className="text-right">
                                 <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                                     NPR {item.total.toLocaleString()}
                                 </span>
                                 <p className="text-xs text-slate-400 font-medium mt-1 uppercase">{item.sub.planName}</p>
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

export default PaymentLogs;
