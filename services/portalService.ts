import { supabase } from './supabase';
import { Attendance } from '../types';

// ─── Portal Member Type (subset of full Member) ─────────────
export interface PortalMember {
  id: string;
  memberNumber: string;
  name: string;
  phone: string;
  memberPassword: string;
  profilePictureUrl: string;
  thumbnailUrl: string;
  accessLevel: string;
  subscription: {
    planName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    daysRemaining: number;
  } | null;
}

// ─── Service ────────────────────────────────────────────────

export const portalService = {
  /**
   * Login: verify phone + password, return member data
   */
  async login(phone: string, password: string): Promise<PortalMember | null> {
    const { data, error } = await supabase
      .rpc('portal_login', { p_phone: phone, p_password: password });

    if (error || !data) return null;

    return {
      id: data.id,
      memberNumber: data.member_number,
      name: data.name,
      phone: data.phone,
      memberPassword: data.member_password,
      profilePictureUrl: data.profile_picture_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      accessLevel: data.access_level || 'Gym',
      subscription: data.subscription ? {
        planName: data.subscription.plan_name,
        startDate: data.subscription.start_date,
        endDate: data.subscription.end_date,
        isActive: data.subscription.is_active,
        daysRemaining: Math.max(0, Math.ceil((new Date(data.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      } : null,
    };
  },

  /**
   * Re-fetch member data (for returning users from localStorage)
   */
  async refreshMember(memberId: string): Promise<PortalMember | null> {
    const { data, error } = await supabase
      .rpc('portal_refresh', { p_member_id: memberId });

    if (error || !data) return null;

    return {
      id: data.id,
      memberNumber: data.member_number,
      name: data.name,
      phone: data.phone,
      memberPassword: data.member_password,
      profilePictureUrl: data.profile_picture_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      accessLevel: data.access_level || 'Gym',
      subscription: data.subscription ? {
        planName: data.subscription.plan_name,
        startDate: data.subscription.start_date,
        endDate: data.subscription.end_date,
        isActive: data.subscription.is_active,
        daysRemaining: Math.max(0, Math.ceil((new Date(data.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      } : null,
    };
  },

  /**
   * Mark attendance for today (upsert — idempotent)
   */
  async markAttendance(memberId: string): Promise<boolean> {
    const { error } = await supabase
      .rpc('portal_mark_attendance', { p_member_id: memberId });

    return !error;
  },

  /**
   * Fetch attendance history for a member (last 60 days)
   */
  async fetchAttendance(memberId: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .rpc('portal_fetch_attendance', { p_member_id: memberId, p_days: 60 });

    if (error) return [];

    return (data || []).map((row: any) => ({
      id: row.id,
      memberId: row.member_id,
      checkInDate: row.check_in_date,
      checkInTime: row.check_in_time,
    }));
  },

  /**
   * Fetch all attendance for a given date (admin view)
   */
  async fetchAttendanceByDate(date: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id, member_id, check_in_date, check_in_time,
        members ( name )
      `)
      .eq('check_in_date', date)
      .order('check_in_time', { ascending: false });

    if (error) return [];

    return (data || []).map((row: any) => ({
      id: row.id,
      memberId: row.member_id,
      memberName: row.members?.name || 'Unknown',
      checkInDate: row.check_in_date,
      checkInTime: row.check_in_time,
    }));
  },

  /**
   * Fetch today's attendance count (for admin dashboard)
   */
  async fetchTodayAttendanceCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('check_in_date', today);

    if (error) return 0;
    return count || 0;
  },

  /**
   * Update member profile (phone and password)
   */
  async updateProfile(memberId: string, phone: string, password: string): Promise<boolean> {
    const { error } = await supabase
      .from('members')
      .update({
        phone: phone,
        member_password: password
      })
      .eq('id', memberId);

    return !error;
  },
};
