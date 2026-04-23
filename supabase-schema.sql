-- =============================================================
-- CLARITY GYM — Supabase Database Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  emergency_contact TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  profile_picture_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payments Table (1-to-1 with subscriptions)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL UNIQUE REFERENCES subscriptions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Full', 'Split')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT FALSE,
  remaining_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notification Log (for future SMS/WhatsApp phase)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- Indexes for common queries
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_members_is_deleted ON members(is_deleted);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);

-- =============================================================
-- Row Level Security (RLS)
-- All authenticated users get full access (same access level)
-- =============================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can do everything
DROP POLICY IF EXISTS "Authenticated users full access" ON members;
CREATE POLICY "Authenticated users full access" ON members
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON subscriptions;
CREATE POLICY "Authenticated users full access" ON subscriptions
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON payments;
CREATE POLICY "Authenticated users full access" ON payments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON notification_log;
CREATE POLICY "Authenticated users full access" ON notification_log
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================
-- Storage bucket for profile pictures
-- Run this AFTER running the table creation above
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/read profile pictures
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'
  );

-- =============================================================
-- 5. Member Portal: Password column for member login
-- =============================================================
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_password TEXT DEFAULT '';

-- =============================================================
-- 6. Attendance Table (for member check-ins via portal)
-- =============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_date ON attendance(check_in_date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Removed insecure anon access policies for attendance
DROP POLICY IF EXISTS "Anyone can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone can read attendance" ON attendance;

DROP POLICY IF EXISTS "Authenticated users full access attendance" ON attendance;
CREATE POLICY "Authenticated users full access attendance" ON attendance
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================
-- Removed insecure anon access to members table
-- =============================================================
DROP POLICY IF EXISTS "Anyone can read members for portal" ON members;

-- =============================================================
-- Secure RPC functions for Portal (Security Definer)
-- =============================================================

-- 1. Portal Login
CREATE OR REPLACE FUNCTION portal_login(p_phone TEXT, p_password TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member record;
  v_subscription record;
  v_result jsonb;
BEGIN
  -- Find member by phone and password
  SELECT * INTO v_member
  FROM members
  WHERE phone = p_phone AND member_password = p_password AND is_deleted = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Find active subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE member_id = v_member.id AND is_active = true AND end_date >= CURRENT_DATE
  ORDER BY end_date DESC
  LIMIT 1;

  v_result := jsonb_build_object(
    'id', v_member.id,
    'member_number', v_member.member_number,
    'name', v_member.name,
    'phone', v_member.phone,
    'profile_picture_url', v_member.profile_picture_url,
    'thumbnail_url', v_member.thumbnail_url,
    'access_level', v_member.access_level,
    'member_password', v_member.member_password,
    'subscription', CASE WHEN v_subscription IS NOT NULL THEN
      jsonb_build_object(
        'plan_name', v_subscription.plan_name,
        'start_date', v_subscription.start_date,
        'end_date', v_subscription.end_date,
        'is_active', v_subscription.is_active
      )
    ELSE NULL END
  );

  RETURN v_result;
END;
$$;

-- 2. Portal Refresh
CREATE OR REPLACE FUNCTION portal_refresh(p_member_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member record;
  v_subscription record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_member
  FROM members
  WHERE id = p_member_id AND is_deleted = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE member_id = v_member.id AND is_active = true AND end_date >= CURRENT_DATE
  ORDER BY end_date DESC
  LIMIT 1;

  v_result := jsonb_build_object(
    'id', v_member.id,
    'member_number', v_member.member_number,
    'name', v_member.name,
    'phone', v_member.phone,
    'profile_picture_url', v_member.profile_picture_url,
    'thumbnail_url', v_member.thumbnail_url,
    'access_level', v_member.access_level,
    'member_password', v_member.member_password,
    'subscription', CASE WHEN v_subscription IS NOT NULL THEN
      jsonb_build_object(
        'plan_name', v_subscription.plan_name,
        'start_date', v_subscription.start_date,
        'end_date', v_subscription.end_date,
        'is_active', v_subscription.is_active
      )
    ELSE NULL END
  );

  RETURN v_result;
END;
$$;

-- 3. Portal Mark Attendance
CREATE OR REPLACE FUNCTION portal_mark_attendance(p_member_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO attendance (member_id, check_in_date, check_in_time)
  VALUES (p_member_id, CURRENT_DATE, NOW())
  ON CONFLICT (member_id, check_in_date) DO NOTHING;
  
  RETURN true;
END;
$$;

-- 4. Portal Fetch Attendance
CREATE OR REPLACE FUNCTION portal_fetch_attendance(p_member_id UUID, p_days INTEGER DEFAULT 60)
RETURNS TABLE (id UUID, member_id UUID, check_in_date DATE, check_in_time TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.member_id, a.check_in_date, a.check_in_time
  FROM attendance a
  WHERE a.member_id = p_member_id AND a.check_in_date >= (CURRENT_DATE - p_days)
  ORDER BY a.check_in_date DESC;
END;
$$;

-- =============================================================
-- Add missing tables
-- =============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Supplement', 'Merchandise', 'Beverage', 'Other')),
  quantity INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,
  purchase_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON inventory;
CREATE POLICY "Authenticated users full access" ON inventory FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON inventory_sales;
CREATE POLICY "Authenticated users full access" ON inventory_sales FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users full access" ON settings;
CREATE POLICY "Authenticated users full access" ON settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

