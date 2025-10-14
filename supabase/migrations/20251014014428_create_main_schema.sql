-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('dpd', 'okk', 'sekjend', 'ketum');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for pengajuan status
DO $$ BEGIN
  CREATE TYPE pengajuan_status AS ENUM (
    'draft',
    'diupload',
    'diverifikasi_okk',
    'ditolak_okk',
    'disetujui_sekjend',
    'ditolak_sekjend',
    'disetujui_ketum',
    'ditolak_ketum',
    'sk_terbit'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'dpd',
  provinsi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create pengajuan_sk table
CREATE TABLE IF NOT EXISTS public.pengajuan_sk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dpd_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status pengajuan_status NOT NULL DEFAULT 'draft',
  
  tanggal_musda DATE NOT NULL,
  lokasi_musda TEXT NOT NULL,
  file_laporan_musda TEXT,
  
  verified_by_okk UUID REFERENCES public.profiles(id),
  verified_okk_at TIMESTAMPTZ,
  approved_by_sekjend UUID REFERENCES public.profiles(id),
  approved_sekjend_at TIMESTAMPTZ,
  approved_by_ketum UUID REFERENCES public.profiles(id),
  approved_ketum_at TIMESTAMPTZ,
  sk_terbit_at TIMESTAMPTZ,
  
  catatan_revisi TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on pengajuan_sk
ALTER TABLE public.pengajuan_sk ENABLE ROW LEVEL SECURITY;

-- Create pengurus table
CREATE TABLE IF NOT EXISTS public.pengurus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pengajuan_id UUID REFERENCES public.pengajuan_sk(id) ON DELETE CASCADE NOT NULL,
  jabatan TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  file_ktp TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on pengurus
ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "DPD can view their own pengajuan" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "Admin roles can view all pengajuan" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "DPD can create their own pengajuan" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "DPD can update their own pengajuan when draft or rejected" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "OKK can update pengajuan for verification" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "Sekjend can update pengajuan for approval" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "Ketum can update pengajuan for final approval" ON public.pengajuan_sk;
  DROP POLICY IF EXISTS "Users can view pengurus of their accessible pengajuan" ON public.pengurus;
  DROP POLICY IF EXISTS "DPD can insert pengurus for their own pengajuan" ON public.pengurus;
  DROP POLICY IF EXISTS "DPD can update pengurus for their own pengajuan" ON public.pengurus;
  DROP POLICY IF EXISTS "DPD can delete pengurus for their own pengajuan" ON public.pengurus;
END $$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for pengajuan_sk
CREATE POLICY "DPD can view their own pengajuan"
  ON public.pengajuan_sk FOR SELECT
  TO authenticated
  USING (auth.uid() = dpd_id);

CREATE POLICY "Admin roles can view all pengajuan"
  ON public.pengajuan_sk FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'okk') OR 
    public.has_role(auth.uid(), 'sekjend') OR 
    public.has_role(auth.uid(), 'ketum')
  );

CREATE POLICY "DPD can create their own pengajuan"
  ON public.pengajuan_sk FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can update their own pengajuan when draft or rejected"
  ON public.pengajuan_sk FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = dpd_id AND 
    status IN ('draft', 'ditolak_okk', 'ditolak_sekjend', 'ditolak_ketum')
  );

CREATE POLICY "OKK can update pengajuan for verification"
  ON public.pengajuan_sk FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'okk'));

CREATE POLICY "Sekjend can update pengajuan for approval"
  ON public.pengajuan_sk FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'sekjend'));

CREATE POLICY "Ketum can update pengajuan for final approval"
  ON public.pengajuan_sk FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'ketum'));

-- RLS Policies for pengurus
CREATE POLICY "Users can view pengurus of their accessible pengajuan"
  ON public.pengurus FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND (
        pengajuan_sk.dpd_id = auth.uid() OR
        public.has_role(auth.uid(), 'okk') OR
        public.has_role(auth.uid(), 'sekjend') OR
        public.has_role(auth.uid(), 'ketum')
      )
    )
  );

CREATE POLICY "DPD can insert pengurus for their own pengajuan"
  ON public.pengurus FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND pengajuan_sk.dpd_id = auth.uid()
    )
  );

CREATE POLICY "DPD can update pengurus for their own pengajuan"
  ON public.pengurus FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND pengajuan_sk.dpd_id = auth.uid()
    )
  );

CREATE POLICY "DPD can delete pengurus for their own pengajuan"
  ON public.pengurus FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND pengajuan_sk.dpd_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_pengajuan_sk_updated_at ON public.pengajuan_sk;
DROP TRIGGER IF EXISTS update_pengurus_updated_at ON public.pengurus;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pengajuan_sk_updated_at
  BEFORE UPDATE ON public.pengajuan_sk
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pengurus_updated_at
  BEFORE UPDATE ON public.pengurus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, provinsi)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'dpd'),
    NEW.raw_user_meta_data->>'provinsi'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    provinsi = EXCLUDED.provinsi;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'dpd')
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();