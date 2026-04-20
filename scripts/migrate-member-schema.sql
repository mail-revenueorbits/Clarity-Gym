-- ============================================================
-- Clarity Gym: Member Schema Migration
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add new columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS dob TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS emergency_contact_2 TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'Gym';

-- 2. Rename the existing emergency_contact column to emergency_contact_1
-- (We'll keep the old column name as-is in DB but the app will treat it as Contact 1)

-- 3. Remove the address column (not in new form)
-- We'll keep it in DB for backwards compatibility but hide it from the form.
-- If you want to fully remove it, uncomment the line below:
-- ALTER TABLE members DROP COLUMN IF EXISTS address;

-- 4. Update RLS policies to include new columns (they inherit existing policies)
-- No action needed - column-level changes are covered by existing row policies.

-- 5. Update existing seed data with sample values for new fields
UPDATE members SET gender = 'Male'   WHERE member_number IN ('CLR-001','CLR-002','CLR-004','CLR-006','CLR-008','CLR-010','CLR-012','CLR-014','CLR-016','CLR-018','CLR-020');
UPDATE members SET gender = 'Female' WHERE member_number IN ('CLR-003','CLR-005','CLR-007','CLR-009','CLR-011','CLR-013','CLR-015','CLR-017','CLR-019');

UPDATE members SET access_level = 'Gym'                WHERE member_number IN ('CLR-001','CLR-003','CLR-006','CLR-011','CLR-016','CLR-018');
UPDATE members SET access_level = 'Gym + Cardio'       WHERE member_number IN ('CLR-002','CLR-005','CLR-007','CLR-009','CLR-012','CLR-014','CLR-019');
UPDATE members SET access_level = 'Gym + Cardio + PT'  WHERE member_number IN ('CLR-004','CLR-008','CLR-010','CLR-013','CLR-015','CLR-017','CLR-020');

UPDATE members SET dob = '1995-03-15' WHERE member_number = 'CLR-001';
UPDATE members SET dob = '1998-07-22' WHERE member_number = 'CLR-002';
UPDATE members SET dob = '2000-01-10' WHERE member_number = 'CLR-003';
UPDATE members SET dob = '1993-11-05' WHERE member_number = 'CLR-004';
UPDATE members SET dob = '1997-06-18' WHERE member_number = 'CLR-005';
UPDATE members SET dob = '2001-09-30' WHERE member_number = 'CLR-006';
UPDATE members SET dob = '1996-04-12' WHERE member_number = 'CLR-007';
UPDATE members SET dob = '1994-08-25' WHERE member_number = 'CLR-008';
UPDATE members SET dob = '1999-12-02' WHERE member_number = 'CLR-009';
UPDATE members SET dob = '1992-02-28' WHERE member_number = 'CLR-010';
UPDATE members SET dob = '2002-05-14' WHERE member_number = 'CLR-011';
UPDATE members SET dob = '1991-10-08' WHERE member_number = 'CLR-012';
UPDATE members SET dob = '1998-03-20' WHERE member_number = 'CLR-013';
UPDATE members SET dob = '1995-07-01' WHERE member_number = 'CLR-014';
UPDATE members SET dob = '2000-11-17' WHERE member_number = 'CLR-015';
UPDATE members SET dob = '1997-01-23' WHERE member_number = 'CLR-016';
UPDATE members SET dob = '1993-09-09' WHERE member_number = 'CLR-017';
UPDATE members SET dob = '1996-06-30' WHERE member_number = 'CLR-018';
UPDATE members SET dob = '1999-04-05' WHERE member_number = 'CLR-019';
UPDATE members SET dob = '1994-12-19' WHERE member_number = 'CLR-020';

-- Done! Your members table now has: gender, dob, emergency_contact_2, and access_level columns.
