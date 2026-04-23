import React, { useState, useEffect, useMemo } from 'react';
import { Attendance } from '../types';
import { portalService } from '../services/portalService';
import { Calendar, Clock, Users, Loader2, ChevronLeft, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';
import { getFormattedBsDate } from '../utils';

interface AttendanceViewProps {
  onMemberClick?: (id: string) => void;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ onMemberClick }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
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

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    // Don't go into the future
    if (d > new Date()) return;
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Track daily member check-ins via the portal</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Check-ins</p>
            <h3 className="text-2xl font-bold text-slate-800">{todayCount}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Selected Date</p>
            <h3 className="text-2xl font-bold text-slate-800">{records.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Viewing</p>
            <h3 className="text-lg font-bold text-slate-800">{getFormattedBsDate(selectedDate)}</h3>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white"
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Attendance List */}
        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-sm font-medium">Loading attendance...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Calendar className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No check-ins recorded for this date.</p>
              {isToday && <p className="text-xs">Members will appear here as they scan the QR code.</p>}
            </div>
          ) : (
            <div className="space-y-0">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Member</div>
                <div className="col-span-3">Date</div>
                <div className="col-span-3 text-right">Time</div>
              </div>

              {records.map((record, index) => (
                <div
                  key={record.id}
                  onClick={() => onMemberClick?.(record.memberId)}
                  className={`grid grid-cols-12 gap-4 items-center px-4 py-4 transition-colors cursor-pointer group ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  } hover:bg-red-50/50 border-b border-slate-100 last:border-b-0`}
                >
                  {/* Index */}
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      {index + 1}
                    </span>
                  </div>

                  {/* Member Name */}
                  <div className="col-span-6 md:col-span-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm group-hover:text-red-600 transition-colors truncate">
                        {record.memberName || 'Unknown Member'}
                      </span>
                    </div>
                  </div>

                  {/* Date — hidden on mobile since we're viewing by date */}
                  <div className="hidden md:block md:col-span-3">
                    <span className="text-sm font-medium text-slate-500">
                      {getFormattedBsDate(record.checkInDate)}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="col-span-4 md:col-span-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm font-semibold tabular-nums">
                        {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
