-- Insert a payment for EVERY subscription that doesn't have one yet
-- Uses the plan name to determine the correct amount
-- Run this in Supabase SQL Editor

INSERT INTO payments (subscription_id, type, total_amount, deposit_amount, deposit_paid, remaining_paid)
SELECT 
  s.id,
  'Full',
  CASE s.plan_name
    WHEN '1 Month'  THEN 2500
    WHEN '3 Months' THEN 6000
    WHEN '6 Months' THEN 12000
    WHEN '1 Year'   THEN 18000
    ELSE 2500
  END,
  CASE s.plan_name
    WHEN '1 Month'  THEN 2500
    WHEN '3 Months' THEN 6000
    WHEN '6 Months' THEN 12000
    WHEN '1 Year'   THEN 18000
    ELSE 2500
  END,
  true,
  true
FROM subscriptions s
WHERE NOT EXISTS (
  SELECT 1 FROM payments p WHERE p.subscription_id = s.id
);
