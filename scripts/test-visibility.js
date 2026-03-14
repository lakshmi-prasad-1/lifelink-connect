import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkVisibility() {
  console.log('Testing anon key visibility across tables...');

  const tables = ['blood_requests', 'profiles', 'blood_banks', 'donation_camps'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`Table ${table}: Error - ${error.message} (${error.code})`);
    } else {
      console.log(`Table ${table}: Visible rows - ${count}`);
    }
  }
}

checkVisibility();
