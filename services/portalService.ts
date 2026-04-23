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
      .from('members')
      .select(`
        id, member_number, name, phone, profile_picture_url, thumbnail_url, access_level, member_password,
        subscriptions (
          id, plan_name, start_date, end_date, is_active
        )
      `)
      .eq('phone', phone)
      .eq('is_deleted', false)
      .limit(1)
      .single();

    if (error || !data) return null;
    if (data.member_password !== password) return null;

    // Find the latest active subscription
    const today = new Date().toISOString().split('T')[0];
    const subs = (data.subscriptions || []) as any[];
    const activeSub = subs
      .filter((s: any) => s.is_active && s.end_date >= today)
      .sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];

    let subscription: PortalMember['subscription'] = null;
    if (activeSub) {
      const endDate = new Date(activeSub.end_date);
      const todayDate = new Date(today);
      const diffMs = endDate.getTime() - todayDate.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      subscription = {
        planName: activeSub.plan_name,
        startDate: activeSub.start_date,
        endDate: activeSub.end_date,
        isActive: true,
        daysRemaining,
      };
    }

    return {
      id: data.id,
      memberNumber: data.member_number,
      name: data.name,
      phone: data.phone,
      memberPassword: data.member_password,
      profilePictureUrl: data.profile_picture_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      accessLevel: data.access_level || 'Gym',
      subscription,
    };
  },

  /**
   * Re-fetch member data (for returning users from localStorage)
   */
  async refreshMember(memberId: string): Promise<PortalMember | null> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id, member_number, name, phone, profile_picture_url, thumbnail_url, access_level, member_password,
        subscriptions (
          id, plan_name, start_date, end_date, is_active
        )
      `)
      .eq('id', memberId)
      .eq('is_deleted', false)
      .single();

    if (error || !data) return null;

    const today = new Date().toISOString().split('T')[0];
    const subs = (data.subscriptions || []) as any[];
    const activeSub = subs
      .filter((s: any) => s.is_active && s.end_date >= today)
      .sort((a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];

    let subscription: PortalMember['subscription'] = null;
    if (activeSub) {
      const endDate = new Date(activeSub.end_date);
      const todayDate = new Date(today);
      const diffMs = endDate.getTime() - todayDate.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      subscription = {
        planName: activeSub.plan_name,
        startDate: activeSub.start_date,
        endDate: activeSub.end_date,
        isActive: true,
        daysRemaining,
      };
    }

    return {
      id: data.id,
      memberNumber: data.member_number,
      name: data.name,
      phone: data.phone,
      memberPassword: data.member_password,
      profilePictureUrl: data.profile_picture_url || '',
      thumbnailUrl: data.thumbnail_url || '',
      accessLevel: data.access_level || 'Gym',
      subscription,
    };
  },

  /**
   * Mark attendance for today (upsert — idempotent)
   */
  async markAttendance(memberId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('attendance')
      .upsert(
        {
          member_id: memberId,
          check_in_date: today,
          check_in_time: new Date().toISOString(),
        },
        { onConflict: 'member_id,check_in_date' }
      );

    return !error;
  },

  /**
   * Fetch attendance history for a member (last 60 days)
   */
  async fetchAttendance(memberId: string): Promise<Attendance[]> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data, error } = await supabase
      .from('attendance')
      .select('id, member_id, check_in_date, check_in_time')
      .eq('member_id', memberId)
      .gte('check_in_date', sixtyDaysAgo.toISOString().split('T')[0])
      .order('check_in_date', { ascending: false });

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
