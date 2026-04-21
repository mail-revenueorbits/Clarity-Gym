import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { Search, UserPlus, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

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
  const [sortKey, setSortKey] = useState<SortKey>('joinedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const todayStr = new Date().toISOString().split('T')[0];

  const getMemberStatus = (member: Member) => {
    if (member.subscriptions.length === 0) return 'inactive';
    const activeSubs = member.subscriptions.filter(s => s.isActive && s.endDate >= todayStr);
    return activeSubs.length > 0 ? 'active' : 'inactive';
  };

  const getActiveEndDate = (member: Member) => {
    const subs = member.subscriptions.filter(s => s.isActive && s.endDate >= todayStr);
    if (subs.length === 0) return null;
    return subs.sort((a, b) => b.endDate.localeCompare(a.endDate))[0].endDate;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-red-500" />
      : <ChevronDown className="w-3.5 h-3.5 text-red-500" />;
  };

  const currentMembers = useMemo(() => {
    return members
      .filter(m => !m.isDeleted)
      .filter(m => {
        const s = searchTerm.toLowerCase();
        return (
          m.name.toLowerCase().includes(s) ||
          m.phone.includes(s) ||
          m.memberNumber.toLowerCase().includes(s)
        );
      })
      .filter(m => filterStr === 'all' || getMemberStatus(m) === filterStr)
      .sort((a, b) => {
        let valA: string;
        let valB: string;
        switch (sortKey) {
          case 'name':        valA = a.name; valB = b.name; break;
          case 'memberNumber':valA = a.memberNumber; valB = b.memberNumber; break;
          case 'joinedDate':  valA = a.joinedDate; valB = b.joinedDate; break;
          case 'accessLevel': valA = a.accessLevel; valB = b.accessLevel; break;
          case 'status':      valA = getMemberStatus(a); valB = getMemberStatus(b); break;
          default:            valA = a.name; valB = b.name;
        }
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [members, searchTerm, filterStr, sortKey, sortDir]);

  const cols: { key: SortKey; label: string; className: string }[] = [
    { key: 'memberNumber', label: 'ID',            className: 'w-24' },
    { key: 'name',         label: 'Name',          className: 'flex-1 min-w-[140px]' },
    { key: 'accessLevel',  label: 'Plan',          className: 'w-44 hidden md:flex' },
    { key: 'joinedDate',   label: 'Joined',        className: 'w-32 hidden lg:flex' },
    { key: 'status',       label: 'Status',        className: 'w-28' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterStr}
              onChange={e => setFilterStr(e.target.value as any)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 cursor-pointer shadow-sm"
            >
              <option value="all">All Members</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm text-sm whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-slate-400 font-medium -mt-2">
        Showing <span className="text-slate-600 font-bold">{currentMembers.length}</span> members
      </p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header Row */}
        <div className="flex items-center px-5 py-3 border-b border-slate-100 bg-slate-50 gap-4">
          {cols.map(col => (
            <button
              key={col.key}
              onClick={() => handleSort(col.key)}
              className={`${col.className} flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors select-none`}
            >
              {col.label}
              <SortIcon col={col.key} />
            </button>
          ))}
          {/* Expiry column — not sortable */}
          <span className="w-32 hidden xl:block text-xs font-bold uppercase tracking-wider text-slate-400">Expires</span>
          {/* Phone column */}
          <span className="w-36 hidden lg:block text-xs font-bold uppercase tracking-wider text-slate-400">Phone</span>
        </div>

        {/* Rows */}
        {currentMembers.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-slate-500 font-semibold text-base">No members found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {currentMembers.map(member => {
              const status = getMemberStatus(member);
              const isActive = status === 'active';
              const endDate = getActiveEndDate(member);

              return (
                <div
                  key={member.id}
                  onClick={() => onMemberClick(member.id)}
                  className="flex items-center px-5 py-3.5 gap-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  {/* ID */}
                  <span className="w-24 text-xs font-bold text-slate-400 font-mono shrink-0">
                    #{member.memberNumber}
                  </span>

                  {/* Name + avatar */}
                  <div className="flex-1 min-w-[140px] flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 overflow-hidden">
                      {member.thumbnail
                        ? <img src={member.thumbnail} alt={member.name} className="w-full h-full object-cover" />
                        : member.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors truncate">{member.name}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  <span className="w-44 hidden md:block text-sm text-slate-500 font-medium truncate">{member.accessLevel || '—'}</span>

                  {/* Joined */}
                  <span className="w-32 hidden lg:block text-sm text-slate-400 font-medium">{member.joinedDate}</span>

                  {/* Status */}
                  <div className="w-28 shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Expires */}
                  <span className="w-32 hidden xl:block text-sm text-slate-400 font-medium">
                    {endDate || <span className="text-slate-300">—</span>}
                  </span>

                  {/* Phone */}
                  <span className="w-36 hidden lg:block text-sm text-slate-400 font-medium">{member.phone}</span>
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
