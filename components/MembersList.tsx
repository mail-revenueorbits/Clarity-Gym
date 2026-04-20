import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { Search, UserPlus, Filter, ShieldCheck, ShieldAlert } from 'lucide-react';

interface MembersListProps {
  members: Member[];
  onAddClick: () => void;
  onMemberClick: (id: string) => void;
}

const MembersList: React.FC<MembersListProps> = ({ members, onAddClick, onMemberClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStr, setFilterStr] = useState<'all' | 'active' | 'inactive'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const getMemberStatus = (member: Member) => {
     if (member.subscriptions.length === 0) return 'inactive';
     const activeSubs = member.subscriptions.filter(s => s.isActive && s.endDate >= todayStr);
     if (activeSubs.length > 0) return 'active';
     return 'inactive';
  };

  const currentMembers = useMemo(() => {
    return members
      .filter(m => {
        const searchStr = searchTerm.toLowerCase();
        return (
          m.name.toLowerCase().includes(searchStr) ||
          m.phone.includes(searchStr) ||
          m.memberNumber.toLowerCase().includes(searchStr)
        );
      })
      .filter(m => {
        if (filterStr === 'all') return true;
        return getMemberStatus(m) === filterStr;
      })
      .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
  }, [members, searchTerm, filterStr]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex-1 w-full relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500/20 text-slate-800 placeholder-slate-400 font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group min-w-[200px] w-full md:w-auto">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                 <Filter className="w-4 h-4 text-slate-400" />
             </div>
             <select 
               value={filterStr} 
               onChange={(e) => setFilterStr(e.target.value as any)}
               className="appearance-none w-full bg-slate-50 border-none text-slate-700 py-3.5 pl-10 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium text-sm transition-all cursor-pointer"
             >
                <option value="all">All Members</option>
                <option value="active">Active Plan</option>
                <option value="inactive">Expired / No Plan</option>
             </select>
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-5 py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Member</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {currentMembers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Members Found</h3>
            <p className="text-slate-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          currentMembers.map((member) => {
            const status = getMemberStatus(member);
            const isActive = status === 'active';

            return (
              <div 
                key={member.id}
                onClick={() => onMemberClick(member.id)}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-red-100 transition-all overflow-hidden relative cursor-pointer group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-opacity ${isActive ? 'bg-emerald-500' : 'bg-red-500 group-hover:opacity-30'}`} />
                
                <div className="flex justify-between items-start mb-5 relative">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-red-600 transition-colors truncate pr-4">{member.name}</h3>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">#{member.memberNumber} • {member.phone}</p>
                  </div>
                  <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 ${isActive ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-red-100 bg-red-50 text-red-600 shadow-sm'}`}>
                     {member.thumbnail ? (
                       <img src={member.thumbnail} alt={member.name} className="w-full h-full object-cover" />
                     ) : (
                       isActive ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />
                     )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mt-auto">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                       <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                       </span>
                    </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MembersList;
