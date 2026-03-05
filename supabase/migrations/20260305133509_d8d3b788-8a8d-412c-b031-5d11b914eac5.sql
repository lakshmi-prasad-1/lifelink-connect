
-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Donors table (no generated column - eligibility computed in app)
CREATE TABLE public.donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_donation_date DATE,
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available','busy','emergency_only')),
  total_donations INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view donors" ON public.donors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own donor" ON public.donors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own donor" ON public.donors FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blood Requests table
CREATE TABLE public.blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  hospital_name TEXT NOT NULL,
  hospital_location TEXT NOT NULL,
  hospital_latitude DOUBLE PRECISION,
  hospital_longitude DOUBLE PRECISION,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal','urgent','critical')),
  units_needed INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','fulfilled','cancelled')),
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blood requests" ON public.blood_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create blood requests" ON public.blood_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own requests" ON public.blood_requests FOR UPDATE TO authenticated USING (auth.uid() = requester_id);

CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE ON public.blood_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blood Banks table
CREATE TABLE public.blood_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_phone TEXT,
  email TEXT,
  a_pos INT DEFAULT 0,
  a_neg INT DEFAULT 0,
  b_pos INT DEFAULT 0,
  b_neg INT DEFAULT 0,
  ab_pos INT DEFAULT 0,
  ab_neg INT DEFAULT 0,
  o_pos INT DEFAULT 0,
  o_neg INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blood banks" ON public.blood_banks FOR SELECT TO authenticated USING (true);

-- Donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.blood_requests(id),
  blood_bank_id UUID REFERENCES public.blood_banks(id),
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  units INT NOT NULL DEFAULT 1,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donors can view own donations" ON public.donations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.donors WHERE donors.id = donations.donor_id AND donors.user_id = auth.uid())
);
CREATE POLICY "Authenticated can insert donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.donors WHERE donors.id = donations.donor_id AND donors.user_id = auth.uid())
);

-- Donation Camps table
CREATE TABLE public.donation_camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organizer TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  camp_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  contact_phone TEXT,
  max_registrations INT,
  current_registrations INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_camps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view camps" ON public.donation_camps FOR SELECT TO authenticated USING (true);

-- Emergency Posts table
CREATE TABLE public.emergency_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('donor_request','hospital_help','volunteer')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal','urgent','critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved')),
  blood_group TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view emergency posts" ON public.emergency_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create emergency posts" ON public.emergency_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.emergency_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_emergency_posts_updated_at BEFORE UPDATE ON public.emergency_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Camp Registrations table
CREATE TABLE public.camp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES public.donation_camps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(camp_id, user_id)
);

ALTER TABLE public.camp_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own registrations" ON public.camp_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can register for camps" ON public.camp_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_donors_blood_group ON public.donors(blood_group);
CREATE INDEX idx_donors_availability ON public.donors(availability);
CREATE INDEX idx_donors_city ON public.donors(city);
CREATE INDEX idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX idx_blood_requests_blood_group ON public.blood_requests(blood_group);
CREATE INDEX idx_blood_requests_urgency ON public.blood_requests(urgency);
CREATE INDEX idx_emergency_posts_status ON public.emergency_posts(status);
CREATE INDEX idx_donations_donor_id ON public.donations(donor_id);
