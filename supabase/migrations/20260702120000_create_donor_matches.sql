CREATE TABLE IF NOT EXISTS public.donor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, donor_id)
);

ALTER TABLE public.donor_matches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'donor_matches'
    AND policyname = 'Donors can view own matches'
  ) THEN
    CREATE POLICY "Donors can view own matches"
    ON public.donor_matches
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.donors
        WHERE donors.id = donor_matches.donor_id
        AND donors.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'donor_matches'
    AND policyname = 'Requesters can view matches for own requests'
  ) THEN
    CREATE POLICY "Requesters can view matches for own requests"
    ON public.donor_matches
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.blood_requests
        WHERE blood_requests.id = donor_matches.request_id
        AND blood_requests.requester_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'donor_matches'
    AND policyname = 'Donors can create own matches'
  ) THEN
    CREATE POLICY "Donors can create own matches"
    ON public.donor_matches
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.donors
        WHERE donors.id = donor_matches.donor_id
        AND donors.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'donor_matches'
    AND policyname = 'Donors can update own matches'
  ) THEN
    CREATE POLICY "Donors can update own matches"
    ON public.donor_matches
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.donors
        WHERE donors.id = donor_matches.donor_id
        AND donors.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.donors
        WHERE donors.id = donor_matches.donor_id
        AND donors.user_id = auth.uid()
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_donor_matches_request_id ON public.donor_matches(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_matches_donor_id ON public.donor_matches(donor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_donor_matches_request_donor_unique ON public.donor_matches(request_id, donor_id);
