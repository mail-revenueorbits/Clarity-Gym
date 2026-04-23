import { getLocalDateString } from '../utils';
import React, { useMemo, useState } from 'react';
import { Member, PaymentType, Expense, InventorySale } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Download, CalendarDays, Plus, Trash2, Calendar } from 'lucide-react';
import { makeDualDateValueFromAd, getNepaliToday } from '@etpl/nepali-datepicker';
import { formatNepaliDate } from '../utils';

const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

interface FinanceProps {
  members: Member[];
  expenses: Expense[];
  inventorySales: InventorySale[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  privacyMode: boolean;
}

const Finance: React.FC<FinanceProps> = ({ members, expenses, inventorySales, onAddExpense, onDeleteExpense, privacyMode }) => {
  const todayBS = getNepaliToday();
  const [selectedMonth, setSelectedMonth] = useState(todayBS.month);
  const [selectedYear, setSelectedYear] = useState(todayBS.year);

  // Generate year options (centered around current BS year)
  const yearOptions = useMemo(() => [2080, 2081, 2082, 2083, 2084, 2085], []);

  // Quick expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', amount: 0, category: 'Supplies' as Expense['category'], notes: '' });
  const categories: Expense['category'][] = ['Rent', 'Salary', 'Maintenance', 'Supplies', 'Utilities', 'Other'];

  // Revenue for selected month (subscriptions + inventory sales)
  const monthlyRevenue = useMemo(() => {
    let subRevenue = 0;
    const methodBreakdown: Record<string, number> = { Cash: 0, Fonepay: 0, eSewa: 0, 'Bank Transfer': 0 };

    members.forEach(m => {
      if (m.isDeleted) return;
      m.subscriptions.forEach(s => {
        const dual = makeDualDateValueFromAd(new Date(s.startDate));
        const [y, m_] = dual.formatted.bs.split('/').map(Number);
        if (y !== selectedYear || m_ !== selectedMonth) return;
        
        let paid = 0;
        if (s.payment.type === PaymentType.FULL) {
          if (s.payment.depositPaid || s.payment.remainingPaid) paid = s.payment.totalAmount;
        } else {
          if (s.payment.depositPaid) paid += s.payment.depositAmount || 0;
          if (s.payment.remainingPaid) paid += (s.payment.totalAmount - (s.payment.depositAmount || 0));
        }
        subRevenue += paid;
        if (paid > 0) {
          const method = s.payment.method || 'Cash';
          methodBreakdown[method] = (methodBreakdown[method] || 0) + paid;
        }
      });
    });

    let salesRevenue = 0;
    inventorySales.forEach(sale => {
      const dual = makeDualDateValueFromAd(new Date(sale.date));
      const [y, m_] = dual.formatted.bs.split('/').map(Number);
      if (y !== selectedYear || m_ !== selectedMonth) return;
      
      salesRevenue += sale.totalAmount;
      methodBreakdown[sale.method] = (methodBreakdown[sale.method] || 0) + sale.totalAmount;
    });

    return { subRevenue, salesRevenue, total: subRevenue + salesRevenue, methodBreakdown };
  }, [members, inventorySales, selectedMonth]);

  // Expenses for selected month
  const monthlyExpenses = useMemo(() => {
    const categoryBreakdown: Record<string, number> = {};
    let total = 0;
    
    const filtered = expenses.filter(e => {
      const dual = makeDualDateValueFromAd(new Date(e.date));
      const [y, m_] = dual.formatted.bs.split('/').map(Number);
      return y === selectedYear && m_ === selectedMonth;
    });

    filtered.forEach(e => {
      total += e.amount;
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });
    return { total, categoryBreakdown, list: filtered.sort((a, b) => b.date.localeCompare(a.date)) };
  }, [expenses, selectedMonth, selectedYear]);

  const netProfit = monthlyRevenue.total - monthlyExpenses.total;

  // Collection breakdown for pie chart (visual bars)
  const collectionMethods = useMemo(() => {
    const total = monthlyRevenue.total;
    if (total === 0) return [];
    return Object.entries(monthlyRevenue.methodBreakdown)
      .filter(([, amount]) => amount > 0)
      .map(([method, amount]) => ({
        method,
        amount,
        percentage: Math.round((amount / total) * 100)
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyRevenue]);

  const methodColor = (m: string) => {
    switch (m) {
      case 'Cash': return { bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' };
      case 'Fonepay': return { bg: 'bg-violet-500', light: 'bg-violet-50 text-violet-700' };
      case 'eSewa': return { bg: 'bg-green-500', light: 'bg-green-50 text-green-700' };
      case 'Bank Transfer': return { bg: 'bg-sky-500', light: 'bg-sky-50 text-sky-700' };
      default: return { bg: 'bg-slate-400', light: 'bg-slate-100 text-slate-600' };
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const rows = [['Type', 'Description', 'Date', 'Amount (NPR)', 'Method/Category']];

    // Revenue rows
    members.forEach(m => {
      if (m.isDeleted) return;
      m.subscriptions.forEach(s => {
        const dual = makeDualDateValueFromAd(new Date(s.startDate));
        const [y, m_] = dual.formatted.bs.split('/').map(Number);
        if (y !== selectedYear || m_ !== selectedMonth) return;
        
        let paid = 0;
        if (s.payment.type === PaymentType.FULL && (s.payment.depositPaid || s.payment.remainingPaid)) paid = s.payment.totalAmount;
        else if (s.payment.type === PaymentType.SPLIT) {
          if (s.payment.depositPaid) paid += s.payment.depositAmount || 0;
          if (s.payment.remainingPaid) paid += (s.payment.totalAmount - (s.payment.depositAmount || 0));
        }
        if (paid > 0) rows.push(['Revenue', `${m.name} - ${s.planName}`, dual.formatted.bs, paid.toString(), s.payment.method || 'Cash']);
      });
    });

    inventorySales.forEach(sale => {
      const dual = makeDualDateValueFromAd(new Date(sale.date));
      const [y, m_] = dual.formatted.bs.split('/').map(Number);
      if (y !== selectedYear || m_ !== selectedMonth) return;
      
      rows.push(['Revenue (POS)', `Inventory Sale`, dual.formatted.bs, sale.totalAmount.toString(), sale.method]);
    });

    // Expense rows
    monthlyExpenses.list.forEach(e => {
      const dual = makeDualDateValueFromAd(new Date(e.date));
      rows.push(['Expense', e.title, dual.formatted.bs, `-${e.amount}`, e.category]);
    });

    rows.push([]);
    rows.push(['', '', 'Total Revenue', monthlyRevenue.total.toString(), '']);
    rows.push(['', '', 'Total Expenses', `-${monthlyExpenses.total}`, '']);
    rows.push(['', '', 'Net Profit', netProfit.toString(), '']);

    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClarityGym_PnL_${selectedYear}_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.title || !expForm.amount) return;
    onAddExpense({
      id: crypto.randomUUID(),
      title: expForm.title,
      category: expForm.category,
      amount: Number(expForm.amount),
      date: getLocalDateString(),
      notes: expForm.notes,
    });
    setExpForm({ title: '', amount: 0, category: 'Supplies', notes: '' });
    setShowExpenseForm(false);
  };



  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Finance</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">P&L for {NEPALI_MONTHS[selectedMonth - 1]} {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              {NEPALI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-700 outline-none cursor-pointer border-l border-slate-200 pl-1.5 md:pl-2 ml-0.5 md:ml-1"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm text-xs md:text-sm">
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Export</span> CSV
          </button>
        </div>
      </div>

      {/* P&L Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        {/* Revenue */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">NPR {privacyMode ? '••••••' : monthlyRevenue.total.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex gap-3 text-[10px] md:text-xs font-medium text-slate-500 mt-1">
            <span>Subs: NPR {privacyMode ? '••••' : monthlyRevenue.subRevenue.toLocaleString()}</span>
            <span>POS: NPR {privacyMode ? '••••' : monthlyRevenue.salesRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">NPR {privacyMode ? '••••••' : monthlyExpenses.total.toLocaleString()}</h3>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-1">
            {Object.entries(monthlyExpenses.categoryBreakdown).map(([cat, amt]) => (
              <span key={cat} className="text-[9px] md:text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md uppercase">{cat}: {privacyMode ? '••' : amt.toLocaleString()}</span>
            ))}
          </div>
        </div>

        {/* Net Profit */}
        <div className={`rounded-2xl md:rounded-3xl p-4 md:p-6 border shadow-sm relative overflow-hidden ${netProfit >= 0 ? 'bg-slate-900 border-slate-800 text-white' : 'bg-red-900 border-red-800 text-white'}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">Net Profit</p>
              <h3 className="text-xl md:text-2xl font-black tracking-tight">NPR {privacyMode ? '••••••' : netProfit.toLocaleString()}</h3>
            </div>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-400">Revenue minus all operating costs</p>
        </div>
      </div>

      {/* Two-column: Collection Breakdown + Quick Expense Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Collection Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Collection Breakdown</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">How money was collected this month</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          
          {collectionMethods.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">No collections recorded this month.</div>
          ) : (
            <>
              {/* Visual ring */}
              <div className="flex justify-center mb-8">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-40 h-40 transform -rotate-90">
                    {(() => {
                      let offset = 0;
                      const colors = ['#10b981', '#8b5cf6', '#22c55e', '#0ea5e9'];
                      return collectionMethods.map((m, i) => {
                        const dash = (m.percentage / 100) * 100;
                        const el = (
                          <circle key={m.method} cx="18" cy="18" r="15.9155" fill="none" stroke={colors[i % colors.length]} strokeWidth="3.8" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={`${-offset}`} strokeLinecap="round" />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-black text-slate-900">NPR</p>
                    <p className="text-sm font-bold text-slate-500">{privacyMode ? '••••' : monthlyRevenue.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {collectionMethods.map(m => {
                  const colors = methodColor(m.method);
                  return (
                    <div key={m.method}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                          <span className="text-sm font-semibold text-slate-700">{m.method}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors.light}`}>{m.percentage}%</span>
                          <span className="text-sm font-bold text-slate-800 w-28 text-right">NPR {privacyMode ? '••••' : m.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full ${colors.bg} transition-all duration-700`} style={{ width: `${m.percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Quick Expense Logger */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Expense Logger</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Quick-add daily operating costs</p>
            </div>
            <button onClick={() => setShowExpenseForm(!showExpenseForm)} className={`p-2.5 rounded-xl transition-all ${showExpenseForm ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <Plus className={`w-5 h-5 transition-transform ${showExpenseForm ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleAddExpense} className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="e.g. Water Jars" value={expForm.title} onChange={e => setExpForm({...expForm, title: e.target.value})} className="col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-red-500 outline-none" />
                <input required type="number" min="1" placeholder="Amount (NPR)" value={expForm.amount || ''} onChange={e => setExpForm({...expForm, amount: Number(e.target.value)})} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-red-500 outline-none" />
                <select value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value as any})} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:border-red-500 outline-none bg-white">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm shadow-red-200 transition-colors">Add Expense</button>
            </form>
          )}

          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {monthlyExpenses.list.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">No expenses logged for {NEPALI_MONTHS[selectedMonth - 1]} {selectedYear}.</div>
            ) : monthlyExpenses.list.map(exp => {
              const dual = makeDualDateValueFromAd(new Date(exp.date));
              return (
                <div key={exp.id} className="flex items-center justify-between px-6 py-4 group hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                      {exp.category.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{exp.title}</p>
                      <p className="text-xs text-slate-500 font-bold">{exp.category} · {formatNepaliDate(dual.formatted.bs)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-red-600">-NPR {privacyMode ? '••••' : exp.amount.toLocaleString()}</span>
                    <button onClick={() => onDeleteExpense(exp.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
