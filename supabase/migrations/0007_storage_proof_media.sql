-- 0007_storage_proof_media.sql
-- Create storage bucket and policies for proof media

-- Create bucket if not exists
insert into storage.buckets (id, name, public)
select 'proof-media', 'proof-media', true
where not exists (select 1 from storage.buckets where id = 'proof-media');

-- Allow authenticated users to upload and manage their own files under their UID prefix
DROP POLICY IF EXISTS "Proof media read" ON storage.objects;
CREATE POLICY "Proof media read"
ON storage.objects FOR SELECT
USING (bucket_id = 'proof-media');

DROP POLICY IF EXISTS "Proof media upload" ON storage.objects;
CREATE POLICY "Proof media upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proof-media'
  and (auth.role() = 'authenticated')
);

DROP POLICY IF EXISTS "Proof media update own" ON storage.objects;
CREATE POLICY "Proof media update own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'proof-media'
  and (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Proof media delete own" ON storage.objects;
CREATE POLICY "Proof media delete own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'proof-media'
  and (auth.uid()::text = (storage.foldername(name))[1])
);

