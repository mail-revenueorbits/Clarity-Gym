-- Fix: Insert payments for all existing subscriptions
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run

INSERT INTO payments (subscription_id, type, total_amount, deposit_amount, deposit_paid, remaining_paid)
SELECT 
  s.id,
  pay.type,
  pay.total_amount,
  pay.deposit_amount,
  pay.deposit_paid,
  pay.remaining_paid
FROM (VALUES
  ('CLR-001', 'Full',  6000,  6000,  true, true),
  ('CLR-002', 'Full',  18000, 18000, true, true),
  ('CLR-003', 'Full',  2500,  2500,  true, true),
  ('CLR-004', 'Split', 12000, 6000,  true, false),
  ('CLR-005', 'Full',  18000, 18000, true, true),
  ('CLR-006', 'Full',  2500,  2500,  true, true),
  ('CLR-007', 'Full',  6000,  6000,  true, true),
  ('CLR-008', 'Full',  2500,  2500,  true, true),
  ('CLR-009', 'Split', 6000,  3000,  true, false),
  ('CLR-010', 'Full',  2500,  2500,  true, true),
  ('CLR-011', 'Full',  12000, 12000, true, true),
  ('CLR-012', 'Full',  6000,  6000,  true, true),
  ('CLR-013', 'Split', 18000, 9000,  true, false),
  ('CLR-014', 'Full',  2500,  2500,  true, true),
  ('CLR-015', 'Full',  12000, 12000, true, true),
  ('CLR-016', 'Full',  2500,  2500,  true, true),
  ('CLR-017', 'Full',  6000,  6000,  true, true),
  ('CLR-018', 'Full',  2500,  2500,  true, true),
  ('CLR-019', 'Full',  12000, 12000, true, true),
  ('CLR-020', 'Split', 6000,  3000,  true, false)
) AS pay(member_number, type, total_amount, deposit_amount, deposit_paid, remaining_paid)
JOIN members m ON m.member_number = pay.member_number
JOIN subscriptions s ON s.member_id = m.id
WHERE NOT EXISTS (
  SELECT 1 FROM payments p WHERE p.subscription_id = s.id
);
