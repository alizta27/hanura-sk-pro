/*
  # Setup Storage Buckets untuk File Upload

  1. Storage Buckets
    - `laporan-musda` - untuk menyimpan file PDF laporan MUSDA
    - `ktp-pengurus` - untuk menyimpan file KTP pengurus (JPG/PNG/PDF)

  2. Security
    - Enable RLS pada storage buckets
    - DPD dapat upload file untuk pengajuan mereka sendiri
    - Admin (OKK, Sekjend, Ketum) dapat melihat semua file
*/

-- Create storage bucket for laporan MUSDA
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'laporan-musda',
  'laporan-musda',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Create storage bucket for KTP pengurus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ktp-pengurus',
  'ktp-pengurus',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[];

-- RLS Policies for laporan-musda bucket
DO $$ BEGIN
  CREATE POLICY "DPD can upload laporan MUSDA"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'laporan-musda' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own laporan MUSDA"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'laporan-musda' AND
      (
        auth.uid()::text = (storage.foldername(name))[1] OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('okk', 'sekjend', 'ketum')
        )
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "DPD can update their own laporan MUSDA"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'laporan-musda' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "DPD can delete their own laporan MUSDA"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'laporan-musda' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for ktp-pengurus bucket
DO $$ BEGIN
  CREATE POLICY "DPD can upload KTP pengurus"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'ktp-pengurus' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view KTP pengurus"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'ktp-pengurus' AND
      (
        auth.uid()::text = (storage.foldername(name))[1] OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role IN ('okk', 'sekjend', 'ketum')
        )
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "DPD can update KTP pengurus"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'ktp-pengurus' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "DPD can delete KTP pengurus"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'ktp-pengurus' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;