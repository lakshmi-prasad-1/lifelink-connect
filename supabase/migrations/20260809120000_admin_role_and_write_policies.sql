-- Admin role
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = uid), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Blood banks: allow admins to manage inventory (previously read-only for everyone,
-- including admins -- there was no write path at all)
CREATE POLICY "Admins can insert blood banks" ON public.blood_banks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update blood banks" ON public.blood_banks
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Donation camps: track who organized a camp so it can be attributed/managed,
-- and let any authenticated user create one (the "create" form in the UI
-- already existed but had no INSERT policy to satisfy)
ALTER TABLE public.donation_camps ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "Users can create camps" ON public.donation_camps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Organizers and admins can update camps" ON public.donation_camps
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- Camp registrations: allow cancelling a registration
CREATE POLICY "Users can cancel own registration" ON public.camp_registrations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Keep donation_camps.current_registrations in sync automatically instead of
-- relying on client-side read-modify-write (which is also unsafe under
-- concurrent registrations)
CREATE OR REPLACE FUNCTION public.sync_camp_registration_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.donation_camps SET current_registrations = current_registrations + 1 WHERE id = NEW.camp_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.donation_camps SET current_registrations = GREATEST(current_registrations - 1, 0) WHERE id = OLD.camp_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER camp_registration_count_insert
  AFTER INSERT ON public.camp_registrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_camp_registration_count();

CREATE TRIGGER camp_registration_count_delete
  AFTER DELETE ON public.camp_registrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_camp_registration_count();
