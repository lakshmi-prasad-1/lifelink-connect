import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testQuery() {
  console.log('Testing Blood Requests table for B+ requests...');

  const { data, error } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('blood_group', 'B+');
    
  if (error) {
    console.error('Error fetching requests:', error);
    return;
  }
  
  console.log(`Found ${data.length} B+ requests.`);
  if (data.length > 0) {
    console.log('Sample Request:', data[0]);
  } else {
    console.log('No B+ requests found in the entire database.');
  }

  console.log("\nTesting donor table for current users:");
  const { data: donors, error: donorError } = await supabase
    .from('donors')
    .select('full_name, blood_group, city');

  if (donorError) {
    console.error(donorError);
  } else {
    console.log("Current Donors:");
    console.log(donors);
  }
}

testQuery();
