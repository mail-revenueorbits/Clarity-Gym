import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { TrendingDown, Plus, Search, Filter, CalendarDays, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { NepaliDatePicker, makeDualDateValueFromAd } from '@etpl/nepali-datepicker';
import { getFormattedBsDate, getLocalDateString } from '../utils';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  privacyMode: boolean;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense, privacyMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    title: '',
    category: 'Supplies',
    amount: 0,
    date: getLocalDateString(),
    notes: ''
  });

  const categories = ['Rent', 'Salary', 'Maintenance', 'Supplies', 'Utilities', 'Other'];

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(e => filterCategory === 'all' || e.category === filterCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, filterCategory]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;
    
    onAddExpense({
      id: crypto.randomUUID(),
      title: formData.title,
      category: formData.category as any,
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes || ''
    });
    
    setIsModalOpen(false);
    setFormData({
      title: '',
      category: 'Supplies',
      amount: 0,
      date: getLocalDateString(),
      notes: ''
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">Track money out and operating costs</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm text-xs md:text-sm"
        >
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl transition-colors"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Total Expenses (Filtered)</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                NPR {privacyMode ? '••••••' : totalExpenses.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
           <div>
             <h2 className="text-base md:text-lg font-bold text-slate-900 mb-0.5">Expense Log</h2>
             <p className="text-xs md:text-sm text-slate-500 font-medium">Detailed history of operating costs</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search expenses..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full sm:w-64 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
               />
             </div>
             <div className="relative">
               <select 
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value)}
                 className="w-full sm:w-auto appearance-none pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
               >
                 <option value="all">All Categories</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
           </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Expense Details</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No expenses found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                         {getFormattedBsDate(expense.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{expense.title}</div>
                      {expense.notes && <div className="text-xs font-medium text-slate-500 truncate max-w-[200px] mt-0.5">{expense.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-red-600">NPR {privacyMode ? '••••' : expense.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => onDeleteExpense(expense.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredExpenses.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500 text-sm font-medium">
              No expenses found matching your filters.
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                    {expense.category.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{expense.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{expense.category} · {getFormattedBsDate(expense.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-red-600">-NPR {privacyMode ? '••••' : expense.amount.toLocaleString()}</span>
                  <button onClick={() => onDeleteExpense(expense.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto relative z-[10000]">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">Record Expense</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Expense Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-medium" placeholder="e.g. June Electricity Bill" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Amount (NPR)</label>
                  <input required type="number" min="0" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-medium" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-medium bg-white">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="relative z-[60]">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Date</label>
                <NepaliDatePicker
                  value={formData.date ? makeDualDateValueFromAd(new Date(formData.date)) : null}
                  onChange={(val) => setFormData({...formData, date: val?.formatted.ad || ''})}
                  format="YYYY-MM-DD"
                  showCalendarSystemToggle={true}
                  showLanguageToggle={true}
                  classNames={{ 
                    container: "w-full",
                    inputWrapper: "w-full",
                    input: "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-medium box-border" 
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Notes (Optional)</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm font-medium resize-none" rows={3} placeholder="Additional details..." />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm shadow-red-200 transition-colors">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
