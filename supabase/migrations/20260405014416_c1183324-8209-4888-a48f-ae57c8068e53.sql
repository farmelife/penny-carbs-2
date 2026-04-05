-- Allow all authenticated users to read enabled storage providers
CREATE POLICY "Authenticated users can read storage providers"
ON public.storage_providers FOR SELECT
TO authenticated
USING (is_enabled = true);

-- Create food-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload food images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'food-images');

-- Allow public reads
CREATE POLICY "Public can read food images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'food-images');