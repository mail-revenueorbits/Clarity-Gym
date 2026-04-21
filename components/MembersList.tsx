import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { Search, UserPlus, Filter, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight } from 'lucide-react';

interface MembersListProps {
  members: Member[];
  onAddClick: () => void;
  onMemberClick: (id: string) => void;
}

type SortKey = 'name' | 'memberNumber' | 'joinedDate' | 'accessLevel' | 'status';
type SortDir = 'asc' | 'desc';

const MembersList: React.FC<MembersListProps> = ({ members, onAddClick, onMemberClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStr, setFilterStr] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const todayStr = new Date().toISOString().split('T')[0];

  const getMemberStatus = (member: Member) => {
    if (member.subscriptions.length === 0) return 'inactive';
    return member.subscriptions.some(s => s.isActive && s.endDate >= todayStr) ? 'active' : 'inactive';
  };

  const getActiveEndDate = (member: Member) => {
    const subs = member.subscriptions.filter(s => s.isActive && s.endDate >= todayStr);
    if (subs.length === 0) return null;
    return subs.sort((a, b) => b.endDate.localeCompare(a.endDate))[0].endDate;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-red-500" />
      : <ChevronDown className="w-3 h-3 text-red-500" />;
  };

  const currentMembers = useMemo(() => {
    return members
      .filter(m => !m.isDeleted)
      .filter(m => {
        const s = searchTerm.toLowerCase();
        return m.name.toLowerCase().includes(s) || m.phone.includes(s) || m.memberNumber.toLowerCase().includes(s);
      })
      .filter(m => filterStr === 'all' || getMemberStatus(m) === filterStr)
      .sort((a, b) => {
        let valA: string, valB: string;
        switch (sortKey) {
          case 'name':         valA = a.name; valB = b.name; break;
          case 'memberNumber': valA = a.memberNumber; valB = b.memberNumber; break;
          case 'joinedDate':   valA = a.joinedDate; valB = b.joinedDate; break;
          case 'accessLevel':  valA = a.accessLevel; valB = b.accessLevel; break;
          case 'status':       valA = getMemberStatus(a); valB = getMemberStatus(b); break;
          default:             valA = a.name; valB = b.name;
        }
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [members, searchTerm, filterStr, sortKey, sortDir]);

  return (
    <div className="max-w-[1400px] mx-auto pb-12 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Members</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            <span className="text-slate-600 font-bold">{currentMembers.length}</span> members found
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm text-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filterStr}
            onChange={e => setFilterStr(e.target.value as any)}
            className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 cursor-pointer shadow-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_100px_36px] md:grid-cols-[1fr_140px_120px_120px_100px_130px_36px] items-center px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
            Member <SortIcon col="name" />
          </button>
          <button onClick={() => handleSort('accessLevel')} className="hidden md:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
            Plan <SortIcon col="accessLevel" />
          </button>
          <button onClick={() => handleSort('joinedDate')} className="hidden md:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
            Joined <SortIcon col="joinedDate" />
          </button>
          <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-slate-400">Expires</span>
          <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
            Status <SortIcon col="status" />
          </button>
          <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-slate-400">Phone</span>
          <div />
        </div>

        {/* Rows */}
        {currentMembers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-500 font-semibold">No members found</p>
            <p className="text-slate-400 text-sm mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <div>
            {currentMembers.map((member, idx) => {
              const isActive = getMemberStatus(member) === 'active';
              const endDate = getActiveEndDate(member);
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={member.id}
                  onClick={() => onMemberClick(member.id)}
                  className={`grid grid-cols-[1fr_120px_100px_36px] md:grid-cols-[1fr_140px_120px_120px_100px_130px_36px] items-center px-5 py-3.5 cursor-pointer transition-colors group ${isEven ? 'bg-white' : 'bg-slate-50/60'} hover:bg-red-50/40`}
                >
                  {/* Member */}
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 overflow-hidden">
                      {member.thumbnail
                        ? <img src={member.thumbnail} alt="" className="w-full h-full object-cover" />
                        : member.name.charAt(0)
                      }
                    </div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors truncate">{member.name}</p>
                  </div>

                  {/* Plan */}
                  <span className="hidden md:block text-xs font-medium text-slate-500 truncate">{member.accessLevel || '—'}</span>

                  {/* Joined */}
                  <span className="hidden md:block text-xs text-slate-400 font-medium">{member.joinedDate}</span>

                  {/* Expires */}
                  <span className="hidden md:block text-xs text-slate-400 font-medium">{endDate || <span className="text-slate-300">—</span>}</span>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {isActive ? 'Active' : 'Inactive'}
                  </span>

                  {/* Phone */}
                  <span className="hidden md:block text-xs text-slate-400 font-medium">{member.phone}</span>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors justify-self-end" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersList;
