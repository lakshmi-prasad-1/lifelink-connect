import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  console.log('--- Diagnostic Report for donation_camps ---');

  // 1. Check Row Count
  const { count, error: countError } = await supabase
    .from('donation_camps')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Count Error:', countError);
  } else {
    console.log('Total Rows:', count);
  }

  // 2. Try to fetch one row with all columns
  const { data, error: fetchError } = await supabase
    .from('donation_camps')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Fetch Error:', fetchError);
  } else if (data && data.length > 0) {
    console.log('Columns found in database:', Object.keys(data[0]));
  } else {
    console.log('No rows found in table.');
  }
}

diagnose();
