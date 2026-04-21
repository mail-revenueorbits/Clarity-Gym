import React, { useState, useEffect } from 'react';
import { Member, Subscription } from './types';
import Dashboard from './components/Dashboard';
import MembersList from './components/MembersList';
import MemberDetailView from './components/MemberDetailView';
import MemberFormModal from './components/MemberFormModal';
import PaymentLogs from './components/PaymentLogs';
import LoginPage from './components/LoginPage';
import Settings from './components/Settings';
import { useAuth } from './components/AuthContext';
import { LayoutDashboard, Menu, X, Users, Settings as SettingsIcon, CreditCard, Loader2, LogOut, Eye, EyeOff } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'member-details' | 'payment-logs' | 'settings'>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);

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
      setActiveTab('members');
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
    setSelectedMemberId(id);
    setActiveTab('member-details');
  };

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'members': return 'Members Base';
      case 'member-details': return 'Member Profile';
      case 'payment-logs': return 'Payment Logs';
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
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <ClarityIcon className="w-6 h-6 text-red-600" />
            <span className="font-bold text-lg text-slate-800">Clarity Gym</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
          </button>
        </div>

        {/* Sidebar */}
        <nav className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="p-6 flex items-center gap-3 border-b border-slate-100 h-20">
            <ClarityIcon className="w-8 h-8 text-red-600 shrink-0" />
            <span className="font-bold text-xl text-slate-800">Clarity GYM</span>
          </div>
          <div className="p-4 space-y-2 mt-4 flex-1 overflow-y-auto w-full">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'members', icon: Users, label: 'Members' },
              { id: 'payment-logs', icon: CreditCard, label: 'Payment Logs' },
              { id: 'settings', icon: SettingsIcon, label: 'Packages' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
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
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-t border-slate-100 rounded-t-none"
            >
              {privacyMode ? <Eye className="w-5 h-5 text-emerald-500" /> : <EyeOff className="w-5 h-5" />}
              <span>{privacyMode ? 'Show Amounts' : 'Privacy Mode'}</span>
            </button>
          </div>
          {/* Sign Out Button */}
          <div className="p-4 border-t border-slate-100">
            <div className="mb-3 px-4">
              <p className="text-xs font-medium text-slate-400 truncate">{user.email}</p>
            </div>
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="md:ml-64 p-4 md:p-8 min-h-screen transition-all">
          {pageTitle && activeTab !== 'dashboard' && (
              <header className="hidden md:flex justify-between items-center mb-8 h-12">
                <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
                {isLoading && <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Syncing...</div>}
              </header>
          )}

          <div className="animate-in fade-in duration-500">
            {isLoading && members.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4"><Loader2 className="w-8 h-8 animate-spin text-red-600" /><p>Loading data...</p></div>
            ) : (
              <>
                  {activeTab === 'dashboard' && <Dashboard members={members} onMemberClick={handleMemberClick} onAddMember={handleOpenAddMember} privacyMode={privacyMode} />}
                  {activeTab === 'members' && <MembersList members={members} onAddClick={handleOpenAddMember} onMemberClick={handleMemberClick} />}
                  {activeTab === 'member-details' && selectedMember && 
                     <MemberDetailView 
                         member={selectedMember} 
                         onBack={() => setActiveTab('members')} 
                         onEditMember={handleOpenEditMember} 
                         onSaveSubscription={handleSaveSubscription}
                         onDeleteMember={handleDeleteMember}
                     />
                  }
                  {activeTab === 'payment-logs' && <PaymentLogs members={members} onMemberClick={handleMemberClick} privacyMode={privacyMode} />}
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
