import React, { useState, useEffect, useMemo } from 'react';
import { Attendance } from '../types';
import { portalService } from '../services/portalService';
import { Calendar, Clock, Users, Loader2, ChevronLeft, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';
import { getFormattedBsDate, getLocalDateString } from '../utils';
import { NepaliDatePicker, makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

interface AttendanceViewProps {
  onMemberClick?: (id: string) => void;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ onMemberClick }) => {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  // Fetch attendance for selected date
  useEffect(() => {
    const loadAttendance = async () => {
      setIsLoading(true);
      try {
        const data = await portalService.fetchAttendanceByDate(selectedDate);
        setRecords(data);

        // Also get today's count for the stat card
        const count = await portalService.fetchTodayAttendanceCount();
        setTodayCount(count);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttendance();
  }, [selectedDate]);

  const isToday = selectedDate === getLocalDateString();

  const changeDate = (days: number) => {
    // Force local midnight to avoid timezone shift issues
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    
    const newDateStr = getLocalDateString(d);
    if (newDateStr > getLocalDateString()) return; // Don't go into the future
    
    setSelectedDate(newDateStr);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5 md:mt-1">Track daily member check-ins via the portal</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl">
            <UserCheck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Today's Check-ins</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{todayCount}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Selected Date</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{records.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-3 md:p-4 bg-purple-50 text-purple-600 rounded-xl md:rounded-2xl">
            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Viewing</p>
            <h3 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">{getFormattedBsDate(selectedDate)}</h3>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 md:p-2 rounded-lg md:rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors bg-white shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <div className="flex items-center gap-2 md:gap-3 relative z-50">
            <NepaliDatePicker
              value={selectedDate ? makeDualDateValueFromAd(new Date(selectedDate)) : null}
              onChange={(val) => {
                if (val?.formatted.ad) setSelectedDate(val.formatted.ad);
              }}
              format="YYYY-MM-DD"
              showCalendarSystemToggle={true}
              showLanguageToggle={true}
              classNames={{
                input: "px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-slate-200 text-xs md:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white shadow-sm"
              }}
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(getLocalDateString())}
                className="px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-white bg-slate-800 rounded-lg md:rounded-xl hover:bg-slate-900 transition-colors shrink-0 shadow-sm"
              >
                Go to Today
              </button>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="p-1.5 md:p-2 rounded-lg md:rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white shadow-sm"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Attendance List */}
        <div className="p-0 md:p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-sm font-bold">Loading attendance...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Calendar className="w-12 h-12 opacity-20" />
              <p className="text-sm font-bold">No check-ins recorded for this date.</p>
              {isToday && <p className="text-xs font-medium">Members will appear here as they scan the QR code.</p>}
            </div>
          ) : (
            <div className="space-y-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-bold">
                      <th className="px-6 py-4 w-16">#</th>
                      <th className="px-6 py-4">Member</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map((record, index) => (
                      <tr 
                        key={record.id}
                        onClick={() => onMemberClick?.(record.memberId)}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{index + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm group-hover:text-red-600 transition-colors">
                              {record.memberName || 'Unknown Member'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-500">
                            {getFormattedBsDate(record.checkInDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-sm font-bold tabular-nums text-slate-700">
                              {new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-slate-50">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    onClick={() => onMemberClick?.(record.memberId)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer active:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{record.memberName || 'Unknown Member'}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                          Entry #{index + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700 tabular-nums">
                        {new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {getFormattedBsDate(record.checkInDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
