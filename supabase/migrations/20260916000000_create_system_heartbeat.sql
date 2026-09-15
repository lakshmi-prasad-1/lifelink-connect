-- Migration: 20260916000000_create_system_heartbeat.sql
-- Purpose: Dedicated isolated heartbeat table for automated Supabase keep-alive.
-- Safety: Completely isolated from application domain tables (blood_requests, donors, etc.).
-- Storage: Fixed at exactly 1 row (id = 'primary') with upsert updates. Zero database growth.

CREATE TABLE IF NOT EXISTS public._system_heartbeat (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  last_ping TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'automated_cron',
  ping_count BIGINT DEFAULT 1
);

-- Enable RLS
ALTER TABLE public._system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated clients to read and upsert heartbeat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = '_system_heartbeat'
      AND policyname = 'Allow public heartbeat access'
  ) THEN
    CREATE POLICY "Allow public heartbeat access"
      ON public._system_heartbeat
      FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Insert initial record if not exists
INSERT INTO public._system_heartbeat (id, last_ping, source, ping_count)
VALUES ('primary', now(), 'initial_migration', 1)
ON CONFLICT (id) DO NOTHING;
