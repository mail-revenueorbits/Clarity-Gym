-- Seed Script for Clarity Gym: 20 Nepali Members with Subscriptions & Payments
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Insert 20 members
INSERT INTO members (member_number, name, phone, email, address, joined_date, emergency_contact, blood_group, notes, profile_picture_url, thumbnail_url, is_deleted)
VALUES
  ('CLR-001', 'Rajesh Shrestha',   '9841234567', 'rajesh.sth@gmail.com',  'Baneshwor, Kathmandu',     '2025-06-15', 'Sita Shrestha - 9841000111',   'O+',  'Morning batch, weight training focus', '', '', false),
  ('CLR-002', 'Suman Gurung',      '9812345678', 'suman.grg@gmail.com',   'Lazimpat, Kathmandu',      '2025-08-20', 'Binod Gurung - 9812000222',    'A+',  'Cardio focused', '', '', false),
  ('CLR-003', 'Anita Tamang',      '9803456789', 'anita.tmg@gmail.com',   'Boudha, Kathmandu',        '2025-10-01', 'Raju Tamang - 9803000333',     'B+',  'Zumba and yoga', '', '', false),
  ('CLR-004', 'Bikash Thapa',      '9845678901', 'bikash.thp@gmail.com',  'Chabahil, Kathmandu',      '2025-04-10', 'Meena Thapa - 9845000444',     'AB+', 'Powerlifting goals', '', '', false),
  ('CLR-005', 'Priya Maharjan',    '9856789012', 'priya.mhr@gmail.com',   'Patan, Lalitpur',          '2025-11-25', 'Hari Maharjan - 9856000555',   'O-',  'Evening batch', '', '', false),
  ('CLR-006', 'Dipak Rai',         '9867890123', 'dipak.rai@gmail.com',   'Jorpati, Kathmandu',       '2026-01-05', 'Sarita Rai - 9867000666',      'A-',  'New to gym, needs guidance', '', '', false),
  ('CLR-007', 'Sunita Adhikari',   '9878901234', 'sunita.adh@gmail.com',  'Kapan, Kathmandu',         '2025-07-12', 'Kamal Adhikari - 9878000777',  'B+',  'Weight loss program', '', '', false),
  ('CLR-008', 'Roshan Basnet',     '9889012345', 'roshan.bst@gmail.com',  'Swayambhu, Kathmandu',     '2025-03-18', 'Gita Basnet - 9889000888',     'O+',  'Bodybuilding competitor', '', '', false),
  ('CLR-009', 'Kamala Pandey',     '9890123456', 'kamala.pdy@gmail.com',  'Baluwatar, Kathmandu',     '2025-09-30', 'Shyam Pandey - 9890000999',    'A+',  'Has knee injury, avoid heavy squats', '', '', false),
  ('CLR-010', 'Arun KC',           '9801234567', 'arun.kc@gmail.com',     'Thamel, Kathmandu',        '2025-05-22', 'Maya KC - 9801001010',         'AB-', 'Personal training client', '', '', false),
  ('CLR-011', 'Nisha Poudel',      '9842345678', 'nisha.pdl@gmail.com',   'Thankot, Kathmandu',       '2026-02-14', 'Ram Poudel - 9842001111',      'B-',  'Student discount applied', '', '', false),
  ('CLR-012', 'Manish Magar',      '9813456789', 'manish.mgr@gmail.com',  'Kirtipur, Kathmandu',      '2025-12-01', 'Bina Magar - 9813001212',      'O+',  'Martial arts background', '', '', false),
  ('CLR-013', 'Rekha Bhandari',    '9854567890', 'rekha.bnd@gmail.com',   'Bhaktapur, Bhaktapur',     '2026-01-20', 'Deepak Bhandari - 9854001313', 'A+',  'CrossFit interest', '', '', false),
  ('CLR-014', 'Prakash Lama',      '9865678901', 'prakash.lm@gmail.com',  'Budhanilkantha, Kathmandu','2025-06-30', 'Laxmi Lama - 9865001414',      'B+',  'Morning and evening both', '', '', false),
  ('CLR-015', 'Sabina Karki',      '9876789012', 'sabina.krk@gmail.com',  'Kalanki, Kathmandu',       '2025-08-05', 'Suresh Karki - 9876001515',    'O+',  'Strength training', '', '', false),
  ('CLR-016', 'Yogesh Dahal',      '9887890123', 'yogesh.dhl@gmail.com',  'Maharajgunj, Kathmandu',   '2026-03-10', 'Prabha Dahal - 9887001616',    'AB+', 'Diabetic, consult before intensity', '', '', false),
  ('CLR-017', 'Mina Shahi',        '9898901234', 'mina.shi@gmail.com',    'Sankhamul, Kathmandu',     '2025-11-15', 'Mohan Shahi - 9898001717',     'A-',  'Pilates class interest', '', '', false),
  ('CLR-018', 'Hari Bhattarai',    '9809012345', 'hari.btr@gmail.com',    'Koteshwor, Kathmandu',     '2025-07-28', 'Durga Bhattarai - 9809001818', 'B+',  'Referred by CLR-001', '', '', false),
  ('CLR-019', 'Sangita Rijal',     '9840123456', 'sangita.rjl@gmail.com', 'Satdobato, Lalitpur',      '2026-02-01', 'Tilak Rijal - 9840001919',     'O-',  'Prenatal fitness cleared by doctor', '', '', false),
  ('CLR-020', 'Nabin Pokharel',    '9851234567', 'nabin.pkr@gmail.com',   'Dillibazar, Kathmandu',    '2025-10-18', 'Radha Pokharel - 9851002020',  'A+',  'Competitive swimmer, cross-training', '', '', false);


-- 2. Insert subscriptions (mix of active, expiring soon, and expired)
-- We use a CTE to reference the member IDs we just created

INSERT INTO subscriptions (member_id, plan_name, start_date, end_date, notes, is_active)
SELECT m.id, sub.plan_name, sub.start_date::date, sub.end_date::date, '', sub.is_active
FROM (VALUES
  ('CLR-001', '3 Months',  CURRENT_DATE - 30,  CURRENT_DATE + 60,  true),
  ('CLR-002', '1 Year',    CURRENT_DATE - 60,  CURRENT_DATE + 305, true),
  ('CLR-003', '1 Month',   CURRENT_DATE - 5,   CURRENT_DATE + 25,  true),
  ('CLR-004', '6 Months',  CURRENT_DATE - 45,  CURRENT_DATE + 135, true),
  ('CLR-005', '1 Year',    CURRENT_DATE - 100, CURRENT_DATE + 265, true),
  ('CLR-006', '1 Month',   CURRENT_DATE - 26,  CURRENT_DATE + 4,   true),
  ('CLR-007', '3 Months',  CURRENT_DATE - 86,  CURRENT_DATE + 4,   true),
  ('CLR-008', '1 Month',   CURRENT_DATE - 28,  CURRENT_DATE + 2,   true),
  ('CLR-009', '3 Months',  CURRENT_DATE - 85,  CURRENT_DATE + 5,   true),
  ('CLR-010', '1 Month',   CURRENT_DATE - 27,  CURRENT_DATE + 3,   true),
  ('CLR-011', '6 Months',  CURRENT_DATE - 90,  CURRENT_DATE + 90,  true),
  ('CLR-012', '3 Months',  CURRENT_DATE - 15,  CURRENT_DATE + 75,  true),
  ('CLR-013', '1 Year',    CURRENT_DATE - 200, CURRENT_DATE + 165, true),
  ('CLR-014', '1 Month',   CURRENT_DATE - 10,  CURRENT_DATE + 20,  true),
  ('CLR-015', '6 Months',  CURRENT_DATE - 120, CURRENT_DATE + 60,  true),
  ('CLR-016', '1 Month',   CURRENT_DATE - 35,  CURRENT_DATE - 5,   false),
  ('CLR-017', '3 Months',  CURRENT_DATE - 100, CURRENT_DATE - 10,  false),
  ('CLR-018', '1 Month',   CURRENT_DATE - 40,  CURRENT_DATE - 10,  false),
  ('CLR-019', '6 Months',  CURRENT_DATE - 30,  CURRENT_DATE + 150, true),
  ('CLR-020', '3 Months',  CURRENT_DATE - 20,  CURRENT_DATE + 70,  true)
) AS sub(member_number, plan_name, start_date, end_date, is_active)
JOIN members m ON m.member_number = sub.member_number;


-- 3. Insert payments for each subscription
INSERT INTO payments (subscription_id, type, total_amount, deposit_amount, deposit_paid, remaining_paid)
SELECT s.id, pay.type, pay.total_amount, pay.deposit_amount, pay.deposit_paid, pay.remaining_paid
FROM (VALUES
  ('CLR-001', 'Full',  6000,  6000, true,  true),
  ('CLR-002', 'Full',  18000, 18000, true, true),
  ('CLR-003', 'Full',  2500,  2500, true,  true),
  ('CLR-004', 'Split', 12000, 6000, true,  false),
  ('CLR-005', 'Full',  18000, 18000, true, true),
  ('CLR-006', 'Full',  2500,  2500, true,  true),
  ('CLR-007', 'Full',  6000,  6000, true,  true),
  ('CLR-008', 'Full',  2500,  2500, true,  true),
  ('CLR-009', 'Split', 6000,  3000, true,  false),
  ('CLR-010', 'Full',  2500,  2500, true,  true),
  ('CLR-011', 'Full',  12000, 12000, true, true),
  ('CLR-012', 'Full',  6000,  6000, true,  true),
  ('CLR-013', 'Split', 18000, 9000, true,  false),
  ('CLR-014', 'Full',  2500,  2500, true,  true),
  ('CLR-015', 'Full',  12000, 12000, true, true),
  ('CLR-016', 'Full',  2500,  2500, true,  true),
  ('CLR-017', 'Full',  6000,  6000, true,  true),
  ('CLR-018', 'Full',  2500,  2500, true,  true),
  ('CLR-019', 'Full',  12000, 12000, true, true),
  ('CLR-020', 'Split', 6000,  3000, true,  false)
) AS pay(member_number, type, total_amount, deposit_amount, deposit_paid, remaining_paid)
JOIN members m ON m.member_number = pay.member_number
JOIN subscriptions s ON s.member_id = m.id;
