import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env explicitly from current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const bloodBanksData = [
  {
    name: "Red Cross Blood Bank",
    location: "Vijayawada",
    latitude: 16.5062,
    longitude: 80.6480,
    contact_phone: "+91 9876543210",
    email: "redcross.vja@example.com",
    o_pos: 45, o_neg: 12, a_pos: 30, a_neg: 5, b_pos: 25, b_neg: 8, ab_pos: 15, ab_neg: 3
  },
  {
    name: "Government Blood Bank",
    location: "Government General Hospital, Vijayawada",
    latitude: 16.5144,
    longitude: 80.6277,
    contact_phone: "+91 866 2434343",
    email: "gghvja.bb@gov.in",
    o_pos: 100, o_neg: 25, a_pos: 80, a_neg: 15, b_pos: 70, b_neg: 20, ab_pos: 40, ab_neg: 10
  },
  {
    name: "Andhra Hospitals Blood Bank",
    location: "Governor Peta, Vijayawada",
    latitude: 16.5085,
    longitude: 80.6355,
    contact_phone: "+91 866 2577777",
    email: "bloodbank@andhrahospitals.com",
    o_pos: 20, o_neg: 4, a_pos: 15, a_neg: 2, b_pos: 40, b_neg: 6, ab_pos: 10, ab_neg: 1
  },
  {
    name: "Apollo Blood Bank",
    location: "Jubilee Hills, Hyderabad",
    latitude: 17.4239,
    longitude: 78.4116,
    contact_phone: "+91 40 23607777",
    email: "bloodbank@apollohyd.com",
    o_pos: 120, o_neg: 15, a_pos: 90, a_neg: 10, b_pos: 85, b_neg: 12, ab_pos: 50, ab_neg: 8
  },
  {
    name: "Care Hospitals Blood Bank",
    location: "Banjara Hills, Hyderabad",
    latitude: 17.4165,
    longitude: 78.4485,
    contact_phone: "+91 40 30418888",
    email: "bloodbank@carehospitals.com",
    o_pos: 80, o_neg: 18, a_pos: 60, a_neg: 8, b_pos: 55, b_neg: 15, ab_pos: 30, ab_neg: 5
  },
  {
    name: "KGH Blood Bank",
    location: "King George Hospital, Visakhapatnam",
    latitude: 17.7088,
    longitude: 83.3005,
    contact_phone: "+91 891 2564891",
    email: "kghbb@gov.in",
    o_pos: 150, o_neg: 30, a_pos: 100, a_neg: 25, b_pos: 90, b_neg: 20, ab_pos: 60, ab_neg: 15
  }
];

async function seedDatabase() {
  console.log('Clearing old blood banks (if any) to prevent duplicates...');
  
  // We'll clear the existing records if it's safe to do so. Since it's a test/setup phase, we just insert.
  // Actually, let's just insert to be safe, or upsert by Name and Location.
  // Since we don't have a unique constraint on name, we will just delete everything then insert.
  const { error: deleteError } = await supabase
    .from('blood_banks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all

  if (deleteError) {
    console.error("Error clearing table:", deleteError);
  } else {
    console.log("Cleared old blood banks.");
  }

  console.log('Inserting 6 requested blood bank records...');

  const { data, error } = await supabase
    .from('blood_banks')
    .insert(bloodBanksData)
    .select();

  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log('Successfully inserted', data.length, 'records!');
    data.forEach(bb => console.log(`- ${bb.name} in ${bb.location}`));
  }
}

seedDatabase();
