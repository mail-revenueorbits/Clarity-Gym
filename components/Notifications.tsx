import React, { useState, useEffect, useMemo } from 'react';
import { Member } from '../types';
import { Bell, Send, MessageSquare, Clock, CheckCircle2, Users, Search, Filter, ChevronLeft, ChevronRight, CheckSquare, Square, X, Eye } from 'lucide-react';

interface NotificationsProps {
  members: Member[];
  logs: LogEntry[];
  onAddLog: (log: LogEntry) => void;
  credits: number;
  onUseCredits: (count: number) => void;
}

export interface LogEntry {
  id: string;
  type: 'promotion' | 'reminder' | 'alert';
  message: string;
  recipientsCount: number;
  recipientNames: string[];
  status: 'sent' | 'failed' | 'pending';
  timestamp: number;
}

const calculateAge = (dobString: string) => {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};

const Notifications: React.FC<NotificationsProps> = ({ members, logs, onAddLog, credits, onUseCredits }) => {
  // Tabs
  const [viewTab, setViewTab] = useState<'compose' | 'history'>('compose');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Compose State
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [targetMode, setTargetMode] = useState<'demographics' | 'manual'>('demographics');
  
  // Demographics Filters
  const [minAge, setMinAge] = useState<number | ''>(15);
  const [maxAge, setMaxAge] = useState<number | ''>(60);
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  
  // Manual Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // History Pagination & Filtering
  const [logFilter, setLogFilter] = useState<'all' | 'promotion' | 'reminder' | 'alert'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Automated Reminders Effect
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newLogs: LogEntry[] = [];

    members.forEach(member => {
      if (member.isDeleted) return;
      const activeSub = member.subscriptions.find(s => s.isActive);
      if (activeSub) {
        const endDate = new Date(activeSub.endDate);
        endDate.setHours(0, 0, 0, 0);
        
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 3) {
           newLogs.push({
             id: `auto-rem-${member.id}-${activeSub.id}`,
             type: 'reminder',
             message: `Automated Reminder: Hi ${member.name.split(' ')[0]}, your gym subscription expires in 3 days. Please renew at the front desk.`,
             recipientsCount: 1,
             recipientNames: [member.name],
             status: 'sent',
             timestamp: Date.now() - 1000,
           });
        } else if (diffDays === 0) {
           newLogs.push({
             id: `auto-exp-${member.id}-${activeSub.id}`,
             type: 'alert',
             message: `Automated Alert: Hi ${member.name.split(' ')[0]}, your gym subscription expires today!`,
             recipientsCount: 1,
             recipientNames: [member.name],
             status: 'sent',
             timestamp: Date.now(),
           });
        }
      }
    });

    if (newLogs.length > 0) {
      const existingIds = new Set(logs.map(l => l.id));
      const uniqueNewLogs = newLogs.filter(nl => !existingIds.has(nl.id));
      uniqueNewLogs.forEach(nl => onAddLog(nl));
      onUseCredits(uniqueNewLogs.length);
    }
  }, [members]);

  // Derived Audience Calculation
  const activeMembers = useMemo(() => members.filter(m => !m.isDeleted), [members]);

  const targetAudience = useMemo(() => {
    if (targetMode === 'demographics') {
      return activeMembers.filter(m => {
        const age = calculateAge(m.dob);
        const ageMatch = (minAge === '' || age >= minAge) && (maxAge === '' || age <= maxAge);
        const genderMatch = genderFilter === 'All' || m.gender === genderFilter;
        return ageMatch && genderMatch;
      });
    } else {
      return activeMembers.filter(m => selectedMemberIds.has(m.id));
    }
  }, [activeMembers, targetMode, minAge, maxAge, genderFilter, selectedMemberIds]);

  const filteredManualMembers = useMemo(() => {
    if (!searchQuery.trim()) return activeMembers;
    const query = searchQuery.toLowerCase();
    return activeMembers.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.phone.includes(query) || 
      m.memberNumber.toLowerCase().includes(query)
    );
  }, [activeMembers, searchQuery]);

  const toggleMemberSelection = (id: string) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMemberIds(newSet);
  };

  const selectAllFiltered = () => {
    const newSet = new Set(selectedMemberIds);
    filteredManualMembers.forEach(m => newSet.add(m.id));
    setSelectedMemberIds(newSet);
  };

  const clearSelection = () => {
    setSelectedMemberIds(new Set());
  };

  const handleSend = () => {
    if (!message.trim() || targetAudience.length === 0) return;
    
    setIsSending(true);
    // Simulate API call to send SMS
    setTimeout(() => {
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        type: 'promotion',
        message: message,
        recipientsCount: targetAudience.length,
        recipientNames: targetAudience.map(m => m.name),
        status: 'sent',
        timestamp: Date.now(),
      };
      
      onAddLog(newLog);
      onUseCredits(targetAudience.length);
      setMessage('');
      setIsSending(false);
      setViewTab('history');
    }, 1000);
  };

  // History Derived Data
  const filteredLogs = useMemo(() => {
    return logs.filter(log => logFilter === 'all' || log.type === logFilter);
  }, [logs, logFilter]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const currentLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, currentPage]);

  // Reset pagination when filter changes
  useEffect(() => { setCurrentPage(1); }, [logFilter]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Manage SMS broadcasts and logs</p>
        </div>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">SMS Credits Remaining</p>
              <h3 className="text-2xl font-bold text-slate-800">{credits.toLocaleString()}</h3>
            </div>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
            Top Up Credits
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Active Gym Members</p>
            <h3 className="text-2xl font-bold text-slate-800">{activeMembers.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setViewTab('compose')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              viewTab === 'compose' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Broadcast SMS
            </div>
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              viewTab === 'history' ? 'border-red-600 text-red-600 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" /> Notification Logs
            </div>
          </button>
        </div>

        <div className="p-6">
          {viewTab === 'compose' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Audience Selection */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">1. Select Audience</h2>
                  <p className="text-sm text-slate-500">Define who should receive this message.</p>
                </div>

                {/* Mode Selector */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setTargetMode('demographics')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${targetMode === 'demographics' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Demographics
                  </button>
                  <button
                    onClick={() => setTargetMode('manual')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${targetMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Select Members
                  </button>
                </div>

                {/* Target Mode: Demographics */}
                {targetMode === 'demographics' && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Min Age</label>
                        <input
                          type="number"
                          value={minAge}
                          onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : '')}
                          placeholder="e.g. 15"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Max Age</label>
                        <input
                          type="number"
                          value={maxAge}
                          onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : '')}
                          placeholder="e.g. 60"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Gender Focus</label>
                      <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm outline-none bg-white"
                      >
                        <option value="All">All Genders</option>
                        <option value="Male">Male Only</option>
                        <option value="Female">Female Only</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Target Mode: Manual */}
                {targetMode === 'manual' && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col h-[300px]">
                    <div className="relative mb-3 shrink-0">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                      <span className="text-xs font-medium text-slate-500">{selectedMemberIds.size} selected</span>
                      <div className="flex gap-2">
                         <button onClick={selectAllFiltered} className="text-xs text-blue-600 hover:underline">Select All Filtered</button>
                         <button onClick={clearSelection} className="text-xs text-slate-500 hover:underline">Clear</button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-1">
                      {filteredManualMembers.length === 0 ? (
                         <div className="text-center text-xs text-slate-400 p-4">No members found.</div>
                      ) : (
                        filteredManualMembers.map(m => {
                          const isSelected = selectedMemberIds.has(m.id);
                          return (
                            <div 
                              key={m.id} 
                              onClick={() => toggleMemberSelection(m.id)}
                              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-red-50' : ''}`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 text-red-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                                <p className="text-xs text-slate-500 truncate">{m.phone}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
                
                {/* Selected Count Indicator */}
                <div className={`p-4 rounded-xl border ${targetAudience.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                   <p className="text-sm font-medium flex items-center justify-between">
                     <span>Targeting: <strong>{targetAudience.length}</strong> Members</span>
                     {targetAudience.length === 0 && <span className="text-xs bg-red-100 px-2 py-0.5 rounded-full">Nobody selected</span>}
                   </p>
                </div>
              </div>

              {/* Compose Message */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">2. Compose & Send</h2>
                  <p className="text-sm text-slate-500">Craft your message and dispatch it.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-[calc(100%-4rem)] flex flex-col">
                  <div className="flex-1 flex flex-col mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message Content</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your promotion or announcement here..."
                      className="w-full flex-1 rounded-xl border border-slate-300 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm p-4 resize-none outline-none"
                    />
                    <div className="mt-2 flex justify-between text-xs text-slate-500 font-medium px-1">
                      <span>{message.length} characters</span>
                      <span>{Math.ceil((message.length || 1) / 160)} SMS segment(s)</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSend}
                    disabled={isSending || !message.trim() || targetAudience.length === 0 || credits < targetAudience.length}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
                  >
                    {isSending ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send to {targetAudience.length} Members
                      </>
                    )}
                  </button>
                  {credits < targetAudience.length && (
                    <p className="text-xs text-red-600 font-medium text-center mt-3">Not enough SMS credits. Please top up.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewTab === 'history' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span>Filter by Type:</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {(['all', 'promotion', 'reminder', 'alert'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        logFilter === f 
                          ? 'bg-slate-800 text-white shadow-md' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                      <tr>
                        <th className="px-6 py-4">Status & Date</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 w-1/2">Message Content</th>
                        <th className="px-6 py-4 text-right">Recipients</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                            No notifications match your current filter.
                          </td>
                        </tr>
                      ) : (
                        currentLogs.map(log => (
                          <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-red-50/50 transition-colors cursor-pointer group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 mb-1">
                                {log.status === 'sent' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                <span className={`font-semibold capitalize ${log.status === 'sent' ? 'text-emerald-700' : 'text-amber-600'}`}>
                                  {log.status}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border ${
                                log.type === 'promotion' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                log.type === 'reminder' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-slate-700 line-clamp-2 group-hover:text-red-700 transition-colors">{log.message}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-medium text-slate-800">{log.recipientsCount}</span>
                                <Eye className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-xs text-slate-500">
                      Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of <span className="font-semibold text-slate-800">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedLog.type === 'promotion' ? 'bg-purple-100 text-purple-600' :
                  selectedLog.type === 'reminder' ? 'bg-orange-100 text-orange-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {selectedLog.type === 'promotion' ? <Send className="w-5 h-5" /> :
                   selectedLog.type === 'reminder' ? <Clock className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 capitalize">{selectedLog.type}</h2>
                  <p className="text-xs text-slate-500 font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-16">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                  selectedLog.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {selectedLog.status === 'sent' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {selectedLog.status === 'sent' ? 'Delivered' : 'Pending'}
                </span>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Content</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedLog.message}</p>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1.5 px-1">
                  {selectedLog.message.length} chars · {Math.ceil(selectedLog.message.length / 160)} SMS segment(s)
                </p>
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipients</p>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{selectedLog.recipientsCount} people</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-[200px] overflow-y-auto">
                  {selectedLog.recipientNames.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">No recipient details available.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedLog.recipientNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                            {name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
