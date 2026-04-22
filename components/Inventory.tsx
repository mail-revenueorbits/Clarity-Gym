import React, { useState, useMemo } from 'react';
import { InventoryItem, InventorySale, PaymentMethod } from '../types';
import { PackageOpen, Plus, Search, Filter, ShoppingCart, CalendarDays, Edit2, Trash2 } from 'lucide-react';
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface InventoryProps {
  items: InventoryItem[];
  sales: InventorySale[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onAddSale: (sale: InventorySale) => void;
  privacyMode: boolean;
}

const Inventory: React.FC<InventoryProps> = ({ items, sales, onAddItem, onUpdateItem, onAddSale, privacyMode }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'sales'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Sale Modal
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleFormData, setSaleFormData] = useState({
    itemId: '',
    quantity: 1,
    method: 'Cash' as PaymentMethod
  });

  const filteredItems = useMemo(() => {
    return items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const filteredSales = useMemo(() => {
    return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  const totalInventoryValue = useMemo(() => items.reduce((sum, i) => sum + (i.price * i.quantity), 0), [items]);
  const totalSalesRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.totalAmount, 0), [sales]);

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const itemData: InventoryItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      name: fd.get('name') as string,
      category: fd.get('category') as any,
      quantity: Number(fd.get('quantity')),
      price: Number(fd.get('price'))
    };
    if (editingItem) onUpdateItem(itemData);
    else onAddItem(itemData);
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveSale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const item = items.find(i => i.id === saleFormData.itemId);
    if (!item) return;
    if (item.quantity < saleFormData.quantity) {
      alert('Not enough stock available!');
      return;
    }

    onAddSale({
      id: crypto.randomUUID(),
      itemId: item.id,
      quantity: saleFormData.quantity,
      totalAmount: item.price * saleFormData.quantity,
      date: new Date().toISOString().split('T')[0],
      method: saleFormData.method
    });
    
    // Update stock quantity
    onUpdateItem({ ...item, quantity: item.quantity - saleFormData.quantity });
    
    setIsSaleModalOpen(false);
    setSaleFormData({ itemId: '', quantity: 1, method: 'Cash' });
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory & POS</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Manage gym supplies, supplements, and merchandise sales</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button onClick={() => setIsSaleModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-200 text-sm">
            <ShoppingCart className="w-4 h-4" /> New Sale
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PackageOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Inventory Value</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">NPR {privacyMode ? '••••••' : totalInventoryValue.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Sales Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">NPR {privacyMode ? '••••••' : totalSalesRevenue.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 flex items-center p-2 bg-slate-50/50">
           <button onClick={() => setActiveTab('stock')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'stock' ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Current Stock</button>
           <button onClick={() => setActiveTab('sales')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'sales' ? 'bg-white shadow-sm text-slate-900 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Sales History</button>
        </div>

        {activeTab === 'stock' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
               <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="Search inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-red-500 transition-colors" />
               </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Item Name</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Category</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Price</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Stock</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map(item => (
                  <tr key={item.id} className="group hover:bg-slate-50/50">
                    <td className="py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="py-4"><span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{item.category}</span></td>
                    <td className="py-4 text-right font-medium text-slate-600">NPR {item.price}</td>
                    <td className="py-4 text-right">
                       <span className={`font-bold ${item.quantity <= 5 ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50'} px-2.5 py-1 rounded-lg text-sm`}>
                         {item.quantity} units
                       </span>
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Date</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider">Item Sold</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Qty</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Total</th>
                  <th className="pb-3 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSales.map(sale => {
                  const item = items.find(i => i.id === sale.itemId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/50">
                      <td className="py-4 font-medium text-slate-600 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-400"/> {sale.date ? makeDualDateValueFromAd(new Date(sale.date)).formatted.bs : '—'}</td>
                      <td className="py-4 font-bold text-slate-800">{item?.name || 'Unknown Item'}</td>
                      <td className="py-4 text-right font-medium text-slate-600">{sale.quantity}</td>
                      <td className="py-4 text-right font-bold text-emerald-600">NPR {privacyMode ? '••••' : sale.totalAmount.toLocaleString()}</td>
                      <td className="py-4 text-right">
                         <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{sale.method}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50"><h2 className="text-xl font-bold text-slate-800">{editingItem ? 'Edit Item' : 'Add Inventory Item'}</h2></div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Item Name</label><input required name="name" defaultValue={editingItem?.name} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none" /></div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select name="category" defaultValue={editingItem?.category || 'Supplement'} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none bg-white">
                  <option>Supplement</option><option>Merchandise</option><option>Beverage</option><option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Price (NPR)</label><input required type="number" name="price" defaultValue={editingItem?.price} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label><input required type="number" name="quantity" defaultValue={editingItem?.quantity} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none" /></div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl shadow-sm shadow-red-200 hover:bg-red-700">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50"><h2 className="text-xl font-bold text-slate-800">Record Sale (POS)</h2></div>
            <form onSubmit={handleSaveSale} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Select Item</label>
                <select required value={saleFormData.itemId} onChange={e => setSaleFormData({...saleFormData, itemId: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none bg-white">
                  <option value="" disabled>Choose an item in stock</option>
                  {items.filter(i => i.quantity > 0).map(i => <option key={i.id} value={i.id}>{i.name} (NPR {i.price})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label><input required type="number" min="1" value={saleFormData.quantity} onChange={e => setSaleFormData({...saleFormData, quantity: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none" /></div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                  <select value={saleFormData.method} onChange={e => setSaleFormData({...saleFormData, method: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-red-500 outline-none bg-white">
                    <option>Cash</option><option>Fonepay</option><option>eSewa</option><option>Bank Transfer</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsSaleModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl shadow-sm shadow-red-200 hover:bg-red-700">Complete Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
