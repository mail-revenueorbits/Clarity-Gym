-- Fix RLS policies on payments table so the app can read them
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Allow all authenticated users to read payments
CREATE POLICY "Allow authenticated read payments" ON payments
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to create payments  
CREATE POLICY "Allow authenticated insert payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update payments
CREATE POLICY "Allow authenticated update payments" ON payments
  FOR UPDATE TO authenticated USING (true);
