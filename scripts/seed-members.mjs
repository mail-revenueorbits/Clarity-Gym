// Seed script: Inserts 20 realistic Nepali gym members into Supabase
// Run with: node scripts/seed-members.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jahltoapzugtsmgafcdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaGx0b2FwenVndHNtZ2FmY2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzM4NjEsImV4cCI6MjA5MjI0OTg2MX0.nPxubX9TRtSvyk0gvh4IUdiermRvWWR3zXWwsK02uSA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: add/subtract days from a date string
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const today = new Date().toISOString().split('T')[0];

const members = [
  { member_number: 'CLR-001', name: 'Rajesh Shrestha',     phone: '9841234567', email: 'rajesh.sth@gmail.com',   address: 'Baneshwor, Kathmandu',       emergency_contact: 'Sita Shrestha - 9841000111',   blood_group: 'O+', notes: 'Morning batch, weight training focus' },
  { member_number: 'CLR-002', name: 'Suman Gurung',        phone: '9812345678', email: 'suman.grg@gmail.com',    address: 'Lazimpat, Kathmandu',         emergency_contact: 'Binod Gurung - 9812000222',    blood_group: 'A+', notes: 'Cardio focused' },
  { member_number: 'CLR-003', name: 'Anita Tamang',        phone: '9803456789', email: 'anita.tmg@gmail.com',    address: 'Boudha, Kathmandu',           emergency_contact: 'Raju Tamang - 9803000333',     blood_group: 'B+', notes: 'Zumba and yoga' },
  { member_number: 'CLR-004', name: 'Bikash Thapa',        phone: '9845678901', email: 'bikash.thp@gmail.com',   address: 'Chabahil, Kathmandu',         emergency_contact: 'Meena Thapa - 9845000444',     blood_group: 'AB+', notes: 'Powerlifting goals' },
  { member_number: 'CLR-005', name: 'Priya Maharjan',      phone: '9856789012', email: 'priya.mhr@gmail.com',    address: 'Patan, Lalitpur',             emergency_contact: 'Hari Maharjan - 9856000555',   blood_group: 'O-', notes: 'Evening batch' },
  { member_number: 'CLR-006', name: 'Dipak Rai',           phone: '9867890123', email: 'dipak.rai@gmail.com',    address: 'Jorpati, Kathmandu',          emergency_contact: 'Sarita Rai - 9867000666',      blood_group: 'A-', notes: 'New to gym, needs guidance' },
  { member_number: 'CLR-007', name: 'Sunita Adhikari',     phone: '9878901234', email: 'sunita.adh@gmail.com',   address: 'Kapan, Kathmandu',            emergency_contact: 'Kamal Adhikari - 9878000777',  blood_group: 'B+', notes: 'Weight loss program' },
  { member_number: 'CLR-008', name: 'Roshan Basnet',       phone: '9889012345', email: 'roshan.bst@gmail.com',   address: 'Swayambhu, Kathmandu',        emergency_contact: 'Gita Basnet - 9889000888',     blood_group: 'O+', notes: 'Bodybuilding competitor' },
  { member_number: 'CLR-009', name: 'Kamala Pandey',       phone: '9890123456', email: 'kamala.pdy@gmail.com',   address: 'Baluwatar, Kathmandu',        emergency_contact: 'Shyam Pandey - 9890000999',    blood_group: 'A+', notes: 'Has knee injury, avoid heavy squats' },
  { member_number: 'CLR-010', name: 'Arun KC',             phone: '9801234567', email: 'arun.kc@gmail.com',      address: 'Thamel, Kathmandu',           emergency_contact: 'Maya KC - 9801001010',         blood_group: 'AB-', notes: 'Personal training client' },
  { member_number: 'CLR-011', name: 'Nisha Poudel',        phone: '9842345678', email: 'nisha.pdl@gmail.com',    address: 'Thankot, Kathmandu',          emergency_contact: 'Ram Poudel - 9842001111',      blood_group: 'B-', notes: 'Student discount applied' },
  { member_number: 'CLR-012', name: 'Manish Magar',        phone: '9813456789', email: 'manish.mgr@gmail.com',   address: 'Kirtipur, Kathmandu',         emergency_contact: 'Bina Magar - 9813001212',      blood_group: 'O+', notes: 'Martial arts background' },
  { member_number: 'CLR-013', name: 'Rekha Bhandari',      phone: '9854567890', email: 'rekha.bnd@gmail.com',    address: 'Bhaktapur, Bhaktapur',        emergency_contact: 'Deepak Bhandari - 9854001313', blood_group: 'A+', notes: 'CrossFit interest' },
  { member_number: 'CLR-014', name: 'Prakash Lama',        phone: '9865678901', email: 'prakash.lm@gmail.com',   address: 'Budhanilkantha, Kathmandu',   emergency_contact: 'Laxmi Lama - 9865001414',      blood_group: 'B+', notes: 'Morning and evening both' },
  { member_number: 'CLR-015', name: 'Sabina Karki',        phone: '9876789012', email: 'sabina.krk@gmail.com',   address: 'Kalanki, Kathmandu',          emergency_contact: 'Suresh Karki - 9876001515',    blood_group: 'O+', notes: 'Strength training' },
  { member_number: 'CLR-016', name: 'Yogesh Dahal',        phone: '9887890123', email: 'yogesh.dhl@gmail.com',   address: 'Maharajgunj, Kathmandu',      emergency_contact: 'Prabha Dahal - 9887001616',    blood_group: 'AB+', notes: 'Diabetic, consult before intensity' },
  { member_number: 'CLR-017', name: 'Mina Shahi',          phone: '9898901234', email: 'mina.shi@gmail.com',     address: 'Sankhamul, Kathmandu',        emergency_contact: 'Mohan Shahi - 9898001717',     blood_group: 'A-', notes: 'Pilates class interest' },
  { member_number: 'CLR-018', name: 'Hari Bhattarai',      phone: '9809012345', email: 'hari.btr@gmail.com',     address: 'Koteshwor, Kathmandu',        emergency_contact: 'Durga Bhattarai - 9809001818', blood_group: 'B+', notes: 'Referred by CLR-001' },
  { member_number: 'CLR-019', name: 'Sangita Rijal',       phone: '9840123456', email: 'sangita.rjl@gmail.com',  address: 'Satdobato, Lalitpur',         emergency_contact: 'Tilak Rijal - 9840001919',     blood_group: 'O-', notes: 'Prenatal fitness cleared by doctor' },
  { member_number: 'CLR-020', name: 'Nabin Pokharel',      phone: '9851234567', email: 'nabin.pkr@gmail.com',    address: 'Dillibazar, Kathmandu',       emergency_contact: 'Radha Pokharel - 9851002020',  blood_group: 'A+', notes: 'Competitive swimmer, cross-training' },
];

// Subscription configs: mix of active, expiring soon, and expired
const subscriptionConfigs = [
  // Active - plenty of time left
  { plan: '3 Months', daysAgo: 30,  duration: 90,  amount: 6000,  type: 'Full' },
  { plan: '1 Year',   daysAgo: 60,  duration: 365, amount: 18000, type: 'Full' },
  { plan: '1 Month',  daysAgo: 5,   duration: 30,  amount: 2500,  type: 'Full' },
  { plan: '6 Months', daysAgo: 45,  duration: 180, amount: 12000, type: 'Split' },
  { plan: '1 Year',   daysAgo: 100, duration: 365, amount: 18000, type: 'Full' },
  // Expiring soon (within 7 days)
  { plan: '1 Month',  daysAgo: 26,  duration: 30,  amount: 2500,  type: 'Full' },
  { plan: '3 Months', daysAgo: 86,  duration: 90,  amount: 6000,  type: 'Full' },
  { plan: '1 Month',  daysAgo: 28,  duration: 30,  amount: 2500,  type: 'Full' },
  { plan: '3 Months', daysAgo: 85,  duration: 90,  amount: 6000,  type: 'Split' },
  { plan: '1 Month',  daysAgo: 27,  duration: 30,  amount: 2500,  type: 'Full' },
  // Active - mid-term
  { plan: '6 Months', daysAgo: 90,  duration: 180, amount: 12000, type: 'Full' },
  { plan: '3 Months', daysAgo: 15,  duration: 90,  amount: 6000,  type: 'Full' },
  { plan: '1 Year',   daysAgo: 200, duration: 365, amount: 18000, type: 'Split' },
  { plan: '1 Month',  daysAgo: 10,  duration: 30,  amount: 2500,  type: 'Full' },
  { plan: '6 Months', daysAgo: 120, duration: 180, amount: 12000, type: 'Full' },
  // Expired
  { plan: '1 Month',  daysAgo: 35,  duration: 30,  amount: 2500,  type: 'Full' },
  { plan: '3 Months', daysAgo: 100, duration: 90,  amount: 6000,  type: 'Full' },
  { plan: '1 Month',  daysAgo: 40,  duration: 30,  amount: 2500,  type: 'Full' },
  // Active
  { plan: '6 Months', daysAgo: 30,  duration: 180, amount: 12000, type: 'Full' },
  { plan: '3 Months', daysAgo: 20,  duration: 90,  amount: 6000,  type: 'Split' },
];

async function seed() {
  console.log('🌱 Starting seed...\n');

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const subConfig = subscriptionConfigs[i];
    
    // Joined date: between 6 months and 2 years ago
    const joinedDaysAgo = Math.floor(Math.random() * 500) + 180;
    const joinedDate = addDays(today, -joinedDaysAgo);

    // 1. Insert member
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert({
        member_number: m.member_number,
        name: m.name,
        phone: m.phone,
        email: m.email,
        address: m.address,
        joined_date: joinedDate,
        emergency_contact: m.emergency_contact,
        blood_group: m.blood_group,
        notes: m.notes,
        profile_picture_url: '',
        thumbnail_url: '',
        is_deleted: false,
      })
      .select()
      .single();

    if (memberError) {
      console.error(`❌ Failed to insert ${m.name}:`, memberError.message);
      continue;
    }

    // 2. Insert subscription
    const startDate = addDays(today, -subConfig.daysAgo);
    const endDate = addDays(startDate, subConfig.duration);
    const isActive = new Date(endDate) >= new Date(today);

    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        member_id: memberData.id,
        plan_name: subConfig.plan,
        start_date: startDate,
        end_date: endDate,
        notes: '',
        is_active: isActive,
      })
      .select()
      .single();

    if (subError) {
      console.error(`❌ Failed to insert subscription for ${m.name}:`, subError.message);
      continue;
    }

    // 3. Insert payment
    const isSplit = subConfig.type === 'Split';
    const { error: payError } = await supabase
      .from('payments')
      .insert({
        subscription_id: subData.id,
        type: subConfig.type,
        total_amount: subConfig.amount,
        deposit_amount: isSplit ? Math.round(subConfig.amount * 0.5) : subConfig.amount,
        deposit_paid: true,
        remaining_paid: !isSplit, // Split payments have remaining unpaid
      });

    if (payError) {
      console.error(`❌ Failed to insert payment for ${m.name}:`, payError.message);
      continue;
    }

    const status = !isActive ? '🔴 Expired' : (new Date(endDate) - new Date(today)) / 86400000 <= 7 ? '🟡 Expiring' : '🟢 Active';
    console.log(`✅ ${m.member_number} ${m.name.padEnd(22)} ${subConfig.plan.padEnd(10)} ${status}`);
  }

  console.log('\n🎉 Seed complete! 20 members added to your Supabase database.');
}

seed().catch(console.error);
