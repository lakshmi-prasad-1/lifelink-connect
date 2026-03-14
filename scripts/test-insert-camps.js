import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
  console.log('Testing anon insert into donation_camps...');

  const { data, error } = await supabase
    .from('donation_camps')
    .insert({
      name: 'Test Camp ' + Date.now(),
      location: 'Test Location',
      city: 'Test City',
      organizer: 'Test Organizer',
      contact_phone: '1234567890',
      camp_date: '2026-12-31',
      start_time: '09:00',
      current_registrations: 0
    })
    .select();
    
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Successfully inserted!', data);
  }
}

testInsert();
