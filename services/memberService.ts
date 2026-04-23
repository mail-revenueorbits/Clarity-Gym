import { Member, Subscription, PaymentType, PaymentDetails } from '../types';
import { supabase } from './supabase';

// ─── Helpers: Convert between DB rows and app types ─────────

interface DbMember {
  id: string;
  member_number: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  joined_date: string;
  emergency_contact: string;
  emergency_contact_2: string;
  blood_group: string;
  access_level: string;
  notes: string;
  profile_picture_url: string;
  thumbnail_url: string;
  is_deleted: boolean;
  member_password: string;
  created_at: string;
  subscriptions?: DbSubscription[];
}

// Generate a simple 6-character alphanumeric password for portal login
function generatePortalPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0/O, 1/I/L)
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

interface DbSubscription {
  id: string;
  member_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  payments?: DbPayment[] | DbPayment;
}

interface DbPayment {
  id: string;
  subscription_id: string;
  type: string;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  remaining_paid: boolean;
}

function dbToMember(row: DbMember): Member {
  const subscriptions: Subscription[] = (row.subscriptions || []).map(dbToSubscription);

  return {
    id: row.id,
    memberNumber: row.member_number,
    name: row.name,
    gender: row.gender || '',
    phone: row.phone,
    email: row.email || '',
    dob: row.dob || '',
    address: row.address || '',
    joinedDate: row.joined_date,
    emergencyContact: row.emergency_contact || '',
    emergencyContact2: row.emergency_contact_2 || '',
    bloodGroup: row.blood_group || '',
    accessLevel: row.access_level || 'Gym',
    notes: row.notes || '',
    profilePicture: row.profile_picture_url || '',
    thumbnail: row.thumbnail_url || '',
    isDeleted: row.is_deleted,
    memberPassword: row.member_password || '',
    createdAt: new Date(row.created_at).getTime(),
    subscriptions,
  };
}

function dbToSubscription(row: DbSubscription): Subscription {
  // Supabase returns payments as a single object (unique FK) or array
  const rawPayments = row.payments;
  const p = Array.isArray(rawPayments) ? rawPayments[0] : rawPayments;
  const payment: PaymentDetails = p
    ? {
        type: p.type === 'Split' ? PaymentType.SPLIT : PaymentType.FULL,
        totalAmount: p.total_amount,
        depositAmount: p.deposit_amount || undefined,
        depositPaid: p.deposit_paid,
        remainingPaid: p.remaining_paid,
      }
    : {
        type: PaymentType.FULL,
        totalAmount: 0,
        depositPaid: false,
        remainingPaid: false,
      };

  return {
    id: row.id,
    planName: row.plan_name,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes || '',
    createdAt: new Date(row.created_at).getTime(),
    isActive: row.is_active,
    payment,
  };
}

// ─── Image Upload Helper ────────────────────────────────────

async function uploadImage(
  file: { base64: string; fileName: string },
  folder: string
): Promise<string> {
  // Convert base64 to blob
  const res = await fetch(file.base64);
  const blob = await res.blob();

  const filePath = `${folder}/${file.fileName}`;
  
  const { error } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) throw error;

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ─── Service ────────────────────────────────────────────────

export const memberService = {
  async fetchMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        subscriptions (
          *,
          payments (*)
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToMember);
  },

  async fetchDeletedMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        subscriptions (
          *,
          payments (*)
        )
      `)
      .eq('is_deleted', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(dbToMember);
  },

  async createMember(member: Member): Promise<Member> {
    // Handle profile picture upload
    let profilePictureUrl = '';
    let thumbnailUrl = '';

    if (member.profilePicture && member.profilePicture.startsWith('data:')) {
      const memberId = member.id || crypto.randomUUID();
      profilePictureUrl = await uploadImage(
        { base64: member.profilePicture, fileName: `${memberId}-full.jpg` },
        'profiles'
      );
      if (member.thumbnail) {
        thumbnailUrl = await uploadImage(
          { base64: member.thumbnail, fileName: `${memberId}-thumb.jpg` },
          'profiles'
        );
      }
    }

    // Auto-generate a portal password for new members
    const portalPassword = member.memberPassword || generatePortalPassword();

    const { data, error } = await supabase
      .from('members')
      .insert({
        id: member.id || undefined,
        member_number: member.memberNumber,
        name: member.name,
        gender: member.gender,
        phone: member.phone,
        email: member.email,
        dob: member.dob,
        address: member.address,
        joined_date: member.joinedDate,
        emergency_contact: member.emergencyContact,
        emergency_contact_2: member.emergencyContact2,
        blood_group: member.bloodGroup,
        access_level: member.accessLevel,
        notes: member.notes,
        profile_picture_url: profilePictureUrl,
        thumbnail_url: thumbnailUrl,
        member_password: portalPassword,
        is_deleted: false,
      })
      .select(`
        *,
        subscriptions (
          *,
          payments (*)
        )
      `)
      .single();

    if (error) throw error;
    return dbToMember(data);
  },

  async updateMember(member: Member): Promise<Member> {
    // Handle profile picture upload if it's a new base64 image
    let profilePictureUrl = member.profilePicture || '';
    let thumbnailUrl = member.thumbnail || '';

    if (member.profilePicture && member.profilePicture.startsWith('data:')) {
      profilePictureUrl = await uploadImage(
        { base64: member.profilePicture, fileName: `${member.id}-full.jpg` },
        'profiles'
      );
    }
    if (member.thumbnail && member.thumbnail.startsWith('data:')) {
      thumbnailUrl = await uploadImage(
        { base64: member.thumbnail, fileName: `${member.id}-thumb.jpg` },
        'profiles'
      );
    }

    const { error } = await supabase
      .from('members')
      .update({
        member_number: member.memberNumber,
        name: member.name,
        gender: member.gender,
        phone: member.phone,
        email: member.email,
        dob: member.dob,
        address: member.address,
        joined_date: member.joinedDate,
        emergency_contact: member.emergencyContact,
        emergency_contact_2: member.emergencyContact2,
        blood_group: member.bloodGroup,
        access_level: member.accessLevel,
        notes: member.notes,
        profile_picture_url: profilePictureUrl,
        thumbnail_url: thumbnailUrl,
      })
      .eq('id', member.id);

    if (error) throw error;

    // Now handle subscriptions — upsert each one
    for (const sub of member.subscriptions) {
      await this.upsertSubscription(member.id, sub);
    }

    // Re-fetch to get clean data
    const { data: fresh, error: fetchError } = await supabase
      .from('members')
      .select(`
        *,
        subscriptions (
          *,
          payments (*)
        )
      `)
      .eq('id', member.id)
      .single();

    if (fetchError) throw fetchError;
    return dbToMember(fresh);
  },

  async deleteMember(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('members')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async restoreMember(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('members')
      .update({ is_deleted: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async upsertSubscription(memberId: string, subscription: Subscription): Promise<void> {
    // Upsert the subscription
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        id: subscription.id,
        member_id: memberId,
        plan_name: subscription.planName,
        start_date: subscription.startDate,
        end_date: subscription.endDate,
        notes: subscription.notes,
        is_active: subscription.isActive,
      })
      .select()
      .single();

    if (subError) throw subError;

    // Upsert the payment record
    const { error: payError } = await supabase
      .from('payments')
      .upsert(
        {
          subscription_id: subData.id,
          type: subscription.payment.type,
          total_amount: subscription.payment.totalAmount,
          deposit_amount: subscription.payment.depositAmount || 0,
          deposit_paid: subscription.payment.depositPaid,
          remaining_paid: subscription.payment.remainingPaid,
        },
        { onConflict: 'subscription_id' }
      );

    if (payError) throw payError;
  },

  async updatePassword(memberId: string, newPassword: string): Promise<boolean> {
    const { error } = await supabase
      .from('members')
      .update({ member_password: newPassword })
      .eq('id', memberId);

    return !error;
  },
};
