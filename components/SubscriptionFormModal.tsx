import React, { useState } from 'react';
import { Member, Subscription, PaymentType } from '../types';
import { X, Calendar, Plus } from 'lucide-react';

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  existingSubscription?: Subscription;
}

const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({ isOpen, onClose, onSave, existingSubscription }) => {
  const [planName, setPlanName] = useState(existingSubscription?.planName || '1 Month');
  const [startDate, setStartDate] = useState(existingSubscription?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(existingSubscription?.endDate || '');
  const [totalAmount, setTotalAmount] = useState(existingSubscription?.payment.totalAmount || 0);
  const [paymentType, setPaymentType] = useState<PaymentType>(existingSubscription?.payment.type || PaymentType.FULL);
  const [depositAmount, setDepositAmount] = useState(existingSubscription?.payment.depositAmount || 0);
  const [depositPaid, setDepositPaid] = useState(existingSubscription?.payment.depositPaid || false);
  const [remainingPaid, setRemainingPaid] = useState(existingSubscription?.payment.remainingPaid || false);
  const [notes, setNotes] = useState(existingSubscription?.notes || '');
  const [isActive, setIsActive] = useState(existingSubscription?.isActive ?? true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub: Subscription = {
      id: existingSubscription?.id || crypto.randomUUID(),
      planName,
      startDate,
      endDate,
      notes,
      createdAt: existingSubscription?.createdAt || Date.now(),
      isActive,
      payment: {
        type: paymentType,
        totalAmount,
        depositAmount: paymentType === PaymentType.SPLIT ? depositAmount : undefined,
        depositPaid: paymentType === PaymentType.FULL ? remainingPaid : depositPaid, // If full, depositPaid is basically remainingPaid
        remainingPaid
      }
    };
    onSave(sub);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800">{existingSubscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Plan Name / Duration</label>
              <input type="text" required value={planName} onChange={e => setPlanName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="e.g. 3 Months Plan" />
            </div>
             <div className="flex items-center mt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex items-center">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="peer sr-only" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Active Subscription</span>
                </label>
             </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date (Expiry)</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Total Amount (NPR)</label>
                    <input type="number" required value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="5000" />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Payment Type</label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value as PaymentType)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none">
                      <option value={PaymentType.FULL}>Full Payment</option>
                      <option value={PaymentType.SPLIT}>Split / Installment</option>
                    </select>
                 </div>
              </div>

              {paymentType === PaymentType.SPLIT ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Deposit / Paid Amount</label>
                      <input type="number" required value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="2000" />
                   </div>
                   <div className="flex flex-col gap-3 justify-end pb-2">
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={depositPaid} onChange={e => setDepositPaid(e.target.checked)} className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500" />
                         <span className="text-sm text-slate-700 font-medium">Deposit Paid</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={remainingPaid} onChange={e => setRemainingPaid(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                         <span className="text-sm text-slate-700 font-medium">Remaining Settled</span>
                       </label>
                   </div>
                </div>
              ) : (
                 <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remainingPaid} onChange={e => setRemainingPaid(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                      <span className="text-sm text-slate-700 font-medium">Fully Paid</span>
                    </label>
                 </div>
              )}
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
             <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none" placeholder="Any additional notes about this subscription..."></textarea>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-6 py-3 font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
             <button type="submit" className="px-6 py-3 font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2">
                 <Calendar className="w-5 h-5" /> Save Subscription
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionFormModal;
