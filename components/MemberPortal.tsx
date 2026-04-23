import React, { useState, useEffect, useMemo } from 'react';
import { portalService, PortalMember } from '../services/portalService';
import { Attendance } from '../types';
import { Loader2, LogOut, Calendar, Clock, CheckCircle2, AlertTriangle, Dumbbell, Shield, Phone, Lock, ChevronRight, Flame, UserCheck, Timer } from 'lucide-react';
import { getFormattedBsDate } from '../utils';

const STORAGE_KEY = 'clarity_portal_member';

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

const MemberPortal: React.FC = () => {
  const [member, setMember] = useState<PortalMember | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.id) {
            const freshData = await portalService.refreshMember(parsed.id);
            if (freshData) {
              setMember(freshData);
              const isCheckin = window.location.hash.includes('/checkin');
              if (isCheckin) {
                await markAttendanceAndFetch(freshData.id);
                window.history.replaceState(null, '', '#/portal');
              } else {
                await justFetchAttendance(freshData.id);
              }
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch (e) {
        console.error('Session check failed:', e);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setShowSplash(false);
        }, 1500);
      }
    };
    checkSession();
  }, []);

  const justFetchAttendance = async (memberId: string) => {
    try {
      const records = await portalService.fetchAttendance(memberId);
      setAttendance(records);
    } catch (e) {
      console.error('Attendance fetch failed:', e);
    }
  };

  const markAttendanceAndFetch = async (memberId: string) => {
    setIsMarking(true);
    try {
      const success = await portalService.markAttendance(memberId);
      setAttendanceMarked(success);
      const records = await portalService.fetchAttendance(memberId);
      setAttendance(records);
    } catch (e) {
      console.error('Attendance marking failed:', e);
    } finally {
      setIsMarking(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const memberData = await portalService.login(phone.trim(), password.trim());
      if (!memberData) {
        setError('Invalid phone number or password.');
        setIsLoggingIn(false);
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: memberData.id }));
      setMember(memberData);
      
      const isCheckin = window.location.hash.includes('/checkin');
      if (isCheckin) {
        await markAttendanceAndFetch(memberData.id);
        window.history.replaceState(null, '', '#/portal');
      } else {
        await justFetchAttendance(memberData.id);
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMember(null);
    setAttendance([]);
    setAttendanceMarked(false);
    setPhone('');
    setPassword('');
  };

  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = now.getDate();

    const attendedDates = new Set(
      attendance.map(a => {
        const d = new Date(a.checkInDate);
        if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
        return -1;
      }).filter(d => d > 0)
    );

    return { year, month, firstDay, daysInMonth, todayDate, attendedDates };
  }, [attendance]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const currentStreak = useMemo(() => {
    if (attendance.length === 0) return 0;
    const sortedDates = [...new Set(attendance.map(a => a.checkInDate))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    if (sortedDates[0] !== todayStr) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (sortedDates[0] !== yesterdayStr) return 0;
    }

    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(new Date(sortedDates[0]).getTime());
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      
      if (sortedDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [attendance]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return attendance.filter(a => {
      const d = new Date(a.checkInDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [attendance]);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-[100]">
        <ClarityIcon className="w-24 h-24 text-white mb-6 animate-pulse" />
        <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">Clarity</h1>
        <p className="text-white/80 text-sm font-bold tracking-widest uppercase mt-2 shadow-sm bg-red-700 px-4 py-1.5 rounded-full">Member Portal</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="bg-red-600 p-8 text-center text-white">
            <ClarityIcon className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-red-100 mt-2 font-medium">Clarity Gym Member Portal</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Portal Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Sign In & Check In <ChevronRight className="w-5 h-5" /></>}
            </button>
            
            <p className="text-center text-slate-400 text-xs font-medium">
              Your password was sent to you via SMS when you joined.
            </p>
          </form>
        </div>
      </div>
    );
  }

  const sub = member.subscription;
  const isExpired = !sub;
  const isExpiringSoon = sub && sub.daysRemaining <= 7;

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          <ClarityIcon className="w-6 h-6 text-red-600" />
          <span className="font-bold text-slate-800">Clarity Portal</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-red-600 p-6 pt-8 pb-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
            {member.thumbnailUrl ? (
              <img src={member.thumbnailUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold">{member.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{member.name}</h1>
            <p className="text-red-100/80 font-medium text-sm flex items-center gap-2 mt-1">
              <Shield className="w-3.5 h-3.5" /> ID: {member.memberNumber}
            </p>
          </div>
        </div>

        {(attendanceMarked || isMarking) && (
          <div className="mt-8 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
            {isMarking ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="w-10 h-10 bg-emerald-400/20 text-emerald-300 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="font-bold">{isMarking ? 'Marking Attendance...' : 'Checked In Today!'}</p>
              {!isMarking && <p className="text-white/70 text-xs font-medium">Logged at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 -mt-6 space-y-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-800">{currentStreak}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Timer className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-800">{thisMonthCount}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Month</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-800">{attendance.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
          </div>
        </div>

        <div className={`rounded-3xl p-6 border shadow-sm overflow-hidden relative ${
          isExpired ? 'bg-red-50 border-red-100' : 
          isExpiringSoon ? 'bg-amber-50 border-amber-100' : 
          'bg-white border-slate-100'
        }`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Plan</h3>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight">{sub?.planName || 'No Active Plan'}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isExpired ? 'bg-red-100 text-red-600' : 
              isExpiringSoon ? 'bg-amber-100 text-amber-600' : 
              'bg-emerald-100 text-emerald-600'
            }`}>
              {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
            </div>
          </div>

          {sub ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-500">Days Remaining</span>
                <span className="text-slate-800 font-bold">{sub.daysRemaining} Days</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, (sub.daysRemaining / 30) * 100))}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 pt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Ends on {getFormattedBsDate(sub.endDate)}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-red-600 font-bold text-sm">Please visit the desk to renew.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600" />
              {monthNames[calendarData.month]} {calendarData.year}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Check-ins
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-300 text-center uppercase pb-2">{d}</div>
            ))}
            {Array.from({ length: calendarData.firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="h-10"></div>
            ))}
            {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const attended = calendarData.attendedDates.has(day);
              const isToday = day === calendarData.todayDate;
              return (
                <div 
                  key={day} 
                  className={`h-10 rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all relative ${
                    attended ? 'bg-emerald-50 text-emerald-600' : 
                    isToday ? 'border-2 border-red-100 text-red-600' : 
                    'text-slate-400'
                  }`}
                >
                  {day}
                  {attended && <div className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-5">
            {attendance.slice(0, 5).map((a, i) => (
              <div key={a.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{getFormattedBsDate(a.checkInDate)}</p>
                    <p className="text-xs font-medium text-slate-400">{new Date(a.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                  Attended
                </div>
              </div>
            ))}
            {attendance.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-4">No recent check-ins.</p>
            )}
          </div>
        </div>

        <div className="pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClarityIcon className="w-5 h-5 text-slate-300" />
            <span className="font-bold text-slate-300 text-sm tracking-tight">Clarity Gym Management</span>
          </div>
          <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">© 2026 Premium Fitness System</p>
        </div>
        <div className="pb-12" />
      </div>
    </div>
  </div>
);
};

export default MemberPortal;
