

## Fix: Cook Dashboard Image Upload to Cloudinary

**Problem**: Cooks cannot upload images because:
1. The `storage_providers` table has RLS that only allows admins to read — cooks get no data from `useActiveStorageProvider`, so Cloudinary is never used.
2. The fallback to Supabase Storage also fails because the `food-images` bucket does not exist.

### Changes Required

**1. Add RLS read policy for cooks on `storage_providers` (SQL migration)**
- Add a SELECT policy allowing authenticated users (including cooks) to read enabled storage providers
- This lets the `useActiveStorageProvider` hook return the Cloudinary config for cooks

**2. Create the `food-images` storage bucket (SQL migration)**
- Create a public `food-images` bucket so the Supabase fallback works
- Add RLS policies on `storage.objects` allowing authenticated users to upload to this bucket

These two changes together ensure cooks can upload via Cloudinary (primary) with Supabase Storage as a working fallback.

### Technical Detail

New migration with:
```sql
-- Allow all authenticated users to read storage providers
CREATE POLICY "Authenticated users can read storage providers"
ON public.storage_providers FOR SELECT
TO authenticated
USING (true);

-- Create food-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true);

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
```

