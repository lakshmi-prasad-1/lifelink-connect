/**
 * LifeLink Connect - Supabase Keep-Alive Automation Script
 *
 * Purpose:
 *   Periodically generates safe, harmless activity against the Supabase
 *   backend to prevent project auto-pausing on the Free tier.
 *
 * Safety guarantees:
 *   - Never inserts or alters data in user-facing tables (donors, blood_requests, etc.).
 *   - Only queries publicly readable tables or dedicated system heartbeat table.
 *   - Reads environment variables from process.env or local .env file.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to load .env if process.env values are missing (e.g. running locally without flags)
function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadLocalEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[ERROR] Missing Supabase credentials!');
  console.error('Please configure SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runKeepAlive() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  console.log(`====================================================`);
  console.log(`[KEEP-ALIVE] LifeLink Connect Heartbeat Starting...`);
  console.log(`[KEEP-ALIVE] Timestamp: ${timestamp}`);
  console.log(`[KEEP-ALIVE] Target URL: ${SUPABASE_URL}`);
  console.log(`====================================================`);

  let readSuccess = false;
  let writeSuccess = false;

  // 1. Safe Read Ping (PostgREST API activity)
  try {
    const readStart = Date.now();
    const { count, error: readError } = await supabase
      .from('blood_banks')
      .select('*', { count: 'exact', head: true });

    const readDuration = Date.now() - readStart;

    if (readError) {
      console.warn(`[WARN] Read ping to 'blood_banks' returned an error:`, readError.message);
    } else {
      console.log(`[SUCCESS] Read ping successful: 'blood_banks' has ${count} records (${readDuration}ms).`);
      readSuccess = true;
    }
  } catch (err) {
    console.warn(`[WARN] Exception during read ping:`, err.message);
  }

  // 2. Heartbeat Record Upsert (Dedicated isolated table: _system_heartbeat)
  try {
    const writeStart = Date.now();
    const { data: existingHeartbeat } = await supabase
      .from('_system_heartbeat')
      .select('ping_count')
      .eq('id', 'primary')
      .maybeSingle();

    const nextCount = (existingHeartbeat?.ping_count || 0) + 1;

    const { error: writeError } = await supabase
      .from('_system_heartbeat')
      .upsert({
        id: 'primary',
        last_ping: new Date().toISOString(),
        source: 'automated_cron',
        ping_count: nextCount,
      }, { onConflict: 'id' });

    const writeDuration = Date.now() - writeStart;

    if (writeError) {
      // If table does not exist yet, that's okay — read ping already registered API activity
      if (
        writeError.code === '42P01' ||
        writeError.code === 'PGRST205' ||
        writeError.message?.includes('schema cache') ||
        writeError.message?.includes('does not exist')
      ) {
        console.log(`[INFO] Dedicated table '_system_heartbeat' not found in database schema.`);
        console.log(`[INFO] (Optional: apply supabase/migrations/20260916000000_create_system_heartbeat.sql for dedicated heartbeat tracking).`);
      } else {
        console.warn(`[WARN] Heartbeat write returned an error:`, writeError.message);
      }
    } else {
      console.log(`[SUCCESS] Dedicated heartbeat updated: ping #${nextCount} (${writeDuration}ms).`);
      writeSuccess = true;
    }
  } catch (err) {
    console.warn(`[WARN] Exception during heartbeat write:`, err.message);
  }

  const totalDuration = Date.now() - startTime;
  console.log(`----------------------------------------------------`);
  console.log(`[KEEP-ALIVE] Completed in ${totalDuration}ms.`);
  console.log(`[KEEP-ALIVE] Read Activity:  ${readSuccess ? 'ACTIVE (OK)' : 'FAILED'}`);
  console.log(`[KEEP-ALIVE] Write Activity: ${writeSuccess ? 'ACTIVE (OK)' : 'SKIPPED/UNCONFIGURED'}`);
  console.log(`====================================================`);

  // As long as at least read or write succeeded, PostgREST received traffic and Supabase is kept active.
  if (readSuccess || writeSuccess) {
    process.exit(0);
  } else {
    console.error(`[FATAL] Both read and write operations failed to connect to Supabase.`);
    process.exit(1);
  }
}

runKeepAlive().catch((err) => {
  console.error(`[FATAL UNCAUGHT ERROR]:`, err);
  process.exit(1);
});
