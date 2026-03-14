import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySchema() {
  console.log('Checking donation_camps table...');

  // Try to select the city column
  const { data, error } = await supabase
    .from('donation_camps')
    .select('id, name, city')
    .limit(1);
    
  if (error) {
    console.error('Error selecting city column:', error);
    
    // If it fails, try selection without city to see if the table exists at all
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('donation_camps')
      .select('*')
      .limit(1);
      
    if (fallbackError) {
      console.error('Error selecting all columns:', fallbackError);
    } else {
      console.log('Successfully selected all columns. Columns found on first row:', Object.keys(fallbackData[0] || {}));
    }
  } else {
    console.log('Successfully selected city column!');
    console.log('Sample data:', data);
  }
}

verifySchema();
