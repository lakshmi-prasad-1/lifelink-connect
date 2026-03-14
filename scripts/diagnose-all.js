import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  console.log('--- Diagnostic Report ---');

  // 1. Check donation_camps
  const { count: campsCount, error: campsError } = await supabase
    .from('donation_camps')
    .select('*', { count: 'exact', head: true });
  console.log('Donation Camps Rows:', campsCount ?? 'Error: ' + campsError?.message);

  // 2. Check blood_banks
  const { count: banksCount, error: banksError } = await supabase
    .from('blood_banks')
    .select('*', { count: 'exact', head: true });
  console.log('Blood Banks Rows:', banksCount ?? 'Error: ' + banksError?.message);
  
  if (banksCount && banksCount > 0) {
    const { data: bankData } = await supabase.from('blood_banks').select('*').limit(1);
    console.log('Sample Blood Bank Name:', bankData[0]?.name);
  }
}

diagnose();
