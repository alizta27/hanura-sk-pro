-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('dpd', 'okk', 'sekjend', 'ketum');

-- Create enum for pengajuan status
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

-- Create profiles table
CREATE TABLE public.profiles (
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
CREATE TABLE public.user_roles (
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
CREATE TABLE public.pengajuan_sk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dpd_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status pengajuan_status NOT NULL DEFAULT 'draft',
  
  -- MUSDA info
  tanggal_musda DATE NOT NULL,
  lokasi_musda TEXT NOT NULL,
  file_laporan_musda TEXT,
  
  -- Tracking
  verified_by_okk UUID REFERENCES public.profiles(id),
  verified_okk_at TIMESTAMPTZ,
  approved_by_sekjend UUID REFERENCES public.profiles(id),
  approved_sekjend_at TIMESTAMPTZ,
  approved_by_ketum UUID REFERENCES public.profiles(id),
  approved_ketum_at TIMESTAMPTZ,
  sk_terbit_at TIMESTAMPTZ,
  
  -- Rejection notes
  catatan_revisi TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on pengajuan_sk
ALTER TABLE public.pengajuan_sk ENABLE ROW LEVEL SECURITY;

-- Create pengurus table
CREATE TABLE public.pengurus (
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

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for pengajuan_sk
CREATE POLICY "DPD can view their own pengajuan"
  ON public.pengajuan_sk FOR SELECT
  USING (auth.uid() = dpd_id);

CREATE POLICY "Admin roles can view all pengajuan"
  ON public.pengajuan_sk FOR SELECT
  USING (
    public.has_role(auth.uid(), 'okk') OR 
    public.has_role(auth.uid(), 'sekjend') OR 
    public.has_role(auth.uid(), 'ketum')
  );

CREATE POLICY "DPD can create their own pengajuan"
  ON public.pengajuan_sk FOR INSERT
  WITH CHECK (auth.uid() = dpd_id);

CREATE POLICY "DPD can update their own pengajuan when draft or rejected"
  ON public.pengajuan_sk FOR UPDATE
  USING (
    auth.uid() = dpd_id AND 
    status IN ('draft', 'ditolak_okk', 'ditolak_sekjend', 'ditolak_ketum')
  );

CREATE POLICY "OKK can update pengajuan for verification"
  ON public.pengajuan_sk FOR UPDATE
  USING (public.has_role(auth.uid(), 'okk'));

CREATE POLICY "Sekjend can update pengajuan for approval"
  ON public.pengajuan_sk FOR UPDATE
  USING (public.has_role(auth.uid(), 'sekjend'));

CREATE POLICY "Ketum can update pengajuan for final approval"
  ON public.pengajuan_sk FOR UPDATE
  USING (public.has_role(auth.uid(), 'ketum'));

-- RLS Policies for pengurus
CREATE POLICY "Users can view pengurus of their accessible pengajuan"
  ON public.pengurus FOR SELECT
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
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND pengajuan_sk.dpd_id = auth.uid()
    )
  );

CREATE POLICY "DPD can update pengurus for their own pengajuan"
  ON public.pengurus FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND pengajuan_sk.dpd_id = auth.uid()
    )
  );

CREATE POLICY "DPD can delete pengurus for their own pengajuan"
  ON public.pengurus FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pengajuan_sk
      WHERE pengajuan_sk.id = pengurus.pengajuan_id
      AND pengajuan_sk.dpd_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'dpd')
  );
  
  -- Also create user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'dpd')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();