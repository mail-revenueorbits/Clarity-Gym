import React, { useState, useEffect, useCallback } from 'react';
import { Member, Subscription, Expense, InventoryItem, InventorySale } from './types';
import Dashboard from './components/Dashboard';
import MembersList from './components/MembersList';
import MemberDetailView from './components/MemberDetailView';
import MemberFormModal from './components/MemberFormModal';
import PaymentLogs from './components/PaymentLogs';
import LoginPage from './components/LoginPage';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import { LogEntry } from './components/Notifications';
import Expenses from './components/Expenses';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import { useAuth } from './components/AuthContext';
import { LayoutDashboard, Menu, X, Users, PackageOpen, CreditCard, Loader2, LogOut, Eye, EyeOff, Bell, TrendingDown, Settings as SettingsIcon, BarChart3 } from 'lucide-react';
import { memberService } from './services/memberService';

const ClarityIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="m9.25 0h-7.5c-.965 0-1.75.785-1.75 1.75v4.5c0 .965.785 1.75 1.75 1.75h7.5c.965 0 1.75-.785 1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75z"/>
      <path d="m9.25 10h-7.5c-.965 0-1.75.785-1.75 1.75v10.5c0 .965.785 1.75 1.75 1.75h7.5c.965 0 1.75-.785 1.75-1.75v-10.5c0-.965-.785-1.75-1.75-1.75z"/>
      <path d="m22.25 16h-7.5c-.965 0-1.75.785-1.75 1.75v4.5c0 .965.785 1.75 1.75 1.75h7.5c.965 0 1.75-.785 1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75z"/>
      <path d="m22.25 0h-7.5c-.965 0-1.75.785-1.75 1.75v10.5c0 .965.785 1.75 1.75 1.75h7.5c.965 0 1.75-.785 1.75-1.75v-10.5c0-.965-.785-1.75-1.75-1.75z"/>
    </g>
  </svg>
);

const App = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();

  const [showSplash, setShowSplash] = useState(true);
  const [isSplashFading, setIsSplashFading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'member-details' | 'payment-logs' | 'notifications' | 'expenses' | 'inventory' | 'finance' | 'settings'>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- History-aware navigation ---
  type TabId = typeof activeTab;

  const navigateTo = useCallback((tab: TabId, memberId?: string | null) => {
    setActiveTab(tab);
    if (tab === 'member-details' && memberId) {
      setSelectedMemberId(memberId);
    }
    setIsMobileMenuOpen(false);
    window.history.pushState({ tab, memberId: memberId || null }, '', '');
  }, []);

  // Listen for browser back / swipe-back
  useEffect(() => {
    // Push initial state so we have something to go back to
    window.history.replaceState({ tab: 'dashboard', memberId: null }, '', '');

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        if (e.state.memberId) {
          setSelectedMemberId(e.state.memberId);
        }
      } else {
        // No state — go to dashboard
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySales, setInventorySales] = useState<InventorySale[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<LogEntry[]>([
    {
      id: '1',
      type: 'promotion',
      message: 'New Year Offer! Get 20% off on yearly subscriptions. Visit Clarity Gym today.',
      recipientsCount: 45,
      recipientNames: ['All Members (Broadcast)'],
      status: 'sent',
      timestamp: Date.now() - 86400000 * 2,
    },
    {
      id: '2',
      type: 'reminder',
      message: 'Friendly reminder: Your gym subscription expires in 3 days. Please renew at the front desk.',
      recipientsCount: 12,
      recipientNames: ['Expiring Members (Auto)'],
      status: 'sent',
      timestamp: Date.now() - 86400000 * 5,
    }
  ]);
  const [smsCredits, setSmsCredits] = useState(1500);

  // Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  useEffect(() => {
    // Start fade out at 2.5s
    const fadeTimer = setTimeout(() => setIsSplashFading(true), 2500);
    // Remove from DOM at 3.2s (allowing 700ms for transition)
    const removeTimer = setTimeout(() => setShowSplash(false), 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Load members when user is authenticated
  useEffect(() => {
    if (!user) {
      setMembers([]);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const membersData = await memberService.fetchMembers();
        setMembers(membersData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // --- If still loading auth, show splash ---
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-[100]">
        <ClarityIcon className="w-24 h-24 text-white mb-6 animate-pulse" />
        <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">Clarity</h1>
        <p className="text-white/80 text-sm font-bold tracking-widest uppercase mt-2 shadow-sm bg-red-700 px-4 py-1.5 rounded-full">Gym Management</p>
      </div>
    );
  }

  // --- If not authenticated, show login ---
  if (!user) {
    return <LoginPage />;
  }

  // --- Member Handlers ---
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (formData: any) => {
    if (editingMember) {
        const updatedMember: Member = { ...editingMember, ...formData };
        setMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m));
        try {
            const saved = await memberService.updateMember(updatedMember);
            setMembers(prev => prev.map(m => m.id === editingMember.id ? saved : m));
        } catch(error) { console.error(error); }
    } else {
        const optimisticMember: Member = { 
            ...formData, 
            id: crypto.randomUUID(), 
            createdAt: Date.now(), 
            subscriptions: [] 
        };
        setMembers(prev => [optimisticMember, ...prev]);
        try {
            const newMember = await memberService.createMember(optimisticMember);
            setMembers(prev => prev.map(m => m.id === optimisticMember.id ? newMember : m));
        } catch(error) {
            console.error(error);
            setMembers(prev => prev.filter(m => m.id !== optimisticMember.id));
        }
    }
    setIsMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    if (activeTab === 'member-details' && selectedMemberId === id) {
      navigateTo('members');
      setSelectedMemberId(null);
    }
    try {
      await memberService.deleteMember(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveSubscription = async (memberId: string, subscription: Subscription) => {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const subIdx = member.subscriptions.findIndex(s => s.id === subscription.id);
      let newSubs = [...member.subscriptions];
      if (subIdx >= 0) newSubs[subIdx] = subscription;
      else newSubs.push(subscription);

      const updatedMember = { ...member, subscriptions: newSubs };
      setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
      
      try {
          await memberService.updateMember(updatedMember);
      } catch (error) {
          console.error(error);
      }
  };

  const handleMemberClick = (id: string) => {
    navigateTo('member-details', id);
  };

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'members': return 'Members Base';
      case 'member-details': return 'Member Profile';
      case 'payment-logs': return 'Payment Logs';
      case 'notifications': return 'Notifications & SMS';
      case 'settings': return 'Gym Packages';
      default: return 'Clarity Gym';
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const pageTitle = getHeaderTitle();

  return (
    <>
      {showSplash && (
        <div className={`fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-[100] transition-opacity duration-700 ease-in-out ${isSplashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex flex-col items-center">
             <ClarityIcon className="w-24 h-24 text-white mb-6 animate-pulse" />
             <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">Clarity</h1>
             <p className="text-white/80 text-sm font-bold tracking-widest uppercase mt-2 shadow-sm bg-red-700 px-4 py-1.5 rounded-full">Gym Management</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <ClarityIcon className="w-5 h-5 text-red-600" />
            <span className="font-bold text-base text-slate-800">Clarity Gym</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>

        {/* Sidebar */}
        {/* Mobile sidebar overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <nav className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="p-5 flex items-center gap-3 border-b border-slate-100 h-16">
            <ClarityIcon className="w-7 h-7 text-red-600 shrink-0" />
            <span className="font-bold text-lg text-slate-800">Clarity GYM</span>
          </div>
          <div className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto w-full">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'members', icon: Users, label: 'Members' },
              { id: 'payment-logs', icon: CreditCard, label: 'Payment Logs' },
              { id: 'expenses', icon: TrendingDown, label: 'Expenses' },
              { id: 'inventory', icon: PackageOpen, label: 'Inventory' },
              { id: 'finance', icon: BarChart3, label: 'Finance' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'settings', icon: SettingsIcon, label: 'Settings' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => navigateTo(tab.id as TabId)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                  activeTab === tab.id || (activeTab === 'member-details' && tab.id === 'members') 
                  ? 'bg-red-50 text-red-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
            {/* Privacy Toggle */}
            <button 
              onClick={() => setPrivacyMode(!privacyMode)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-t border-slate-100 mt-2 pt-3"
            >
              {privacyMode ? <Eye className="w-5 h-5 text-emerald-500" /> : <EyeOff className="w-5 h-5" />}
              <span>{privacyMode ? 'Show Amounts' : 'Privacy Mode'}</span>
            </button>
          </div>
          {/* Sign Out Button */}
          <div className="p-3 border-t border-slate-100">
            <div className="mb-2 px-4">
              <p className="text-xs font-medium text-slate-400 truncate">{user.email}</p>
            </div>
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="md:ml-64 px-3 py-4 md:p-8 min-h-screen transition-all">
          <div className="animate-in fade-in duration-500">
            {isLoading && members.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4"><Loader2 className="w-8 h-8 animate-spin text-red-600" /><p>Loading data...</p></div>
            ) : (
              <>
                  {activeTab === 'dashboard' && <Dashboard members={members} expenses={expenses} inventorySales={inventorySales} onMemberClick={handleMemberClick} onAddMember={handleOpenAddMember} privacyMode={privacyMode} />}
                  {activeTab === 'members' && <MembersList members={members} onAddClick={handleOpenAddMember} onMemberClick={handleMemberClick} />}
                  {activeTab === 'member-details' && selectedMember && 
                     <MemberDetailView 
                         member={selectedMember} 
                         onBack={() => window.history.back()} 
                         onEditMember={handleOpenEditMember} 
                         onSaveSubscription={handleSaveSubscription}
                         onDeleteMember={handleDeleteMember}
                         notificationLogs={notificationLogs}
                     />
                  }
                  {activeTab === 'payment-logs' && <PaymentLogs members={members} onMemberClick={handleMemberClick} privacyMode={privacyMode} />}
                  {activeTab === 'expenses' && <Expenses expenses={expenses} onAddExpense={(e) => setExpenses([e, ...expenses])} onDeleteExpense={(id) => setExpenses(expenses.filter(e => e.id !== id))} privacyMode={privacyMode} />}
                  {activeTab === 'inventory' && <Inventory items={inventoryItems} sales={inventorySales} onAddItem={(i) => setInventoryItems([i, ...inventoryItems])} onUpdateItem={(i) => setInventoryItems(inventoryItems.map(item => item.id === i.id ? i : item))} onAddSale={(s) => setInventorySales([s, ...inventorySales])} privacyMode={privacyMode} />}
                  {activeTab === 'finance' && <Finance members={members} expenses={expenses} inventorySales={inventorySales} onAddExpense={(e) => setExpenses([e, ...expenses])} onDeleteExpense={(id) => setExpenses(expenses.filter(e => e.id !== id))} privacyMode={privacyMode} />}
                  {activeTab === 'notifications' && <Notifications members={members} logs={notificationLogs} onAddLog={(log) => setNotificationLogs(prev => [log, ...prev].sort((a,b) => b.timestamp - a.timestamp))} credits={smsCredits} onUseCredits={(n) => setSmsCredits(prev => Math.max(0, prev - n))} />}
                  {activeTab === 'settings' && <Settings />}
              </>
            )}
          </div>
        </main>

        <MemberFormModal 
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onSubmit={handleSaveMember}
          initialData={editingMember}
          existingMembers={members}
        />
      </div>
    </>
  );
};

export default App;
