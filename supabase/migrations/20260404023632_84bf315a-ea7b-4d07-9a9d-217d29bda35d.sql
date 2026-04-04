-- Allow cooks to insert images for their allocated dishes
CREATE POLICY "Cooks can insert images for their dishes"
ON public.food_item_images FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cook_dishes cd
    JOIN public.cooks c ON c.id = cd.cook_id
    WHERE cd.food_item_id = food_item_images.food_item_id
      AND c.user_id = auth.uid()
  )
);

-- Allow cooks to delete images for their allocated dishes
CREATE POLICY "Cooks can delete images for their dishes"
ON public.food_item_images FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cook_dishes cd
    JOIN public.cooks c ON c.id = cd.cook_id
    WHERE cd.food_item_id = food_item_images.food_item_id
      AND c.user_id = auth.uid()
  )
);

-- Storage: allow cooks to upload to food-items bucket
CREATE POLICY "Cooks can upload food item images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'food-items'
  AND EXISTS (
    SELECT 1 FROM public.cooks c
    WHERE c.user_id = auth.uid() AND c.is_active = true
  )
);

-- Storage: allow cooks to delete their uploads from food-items bucket
CREATE POLICY "Cooks can delete food item images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'food-items'
  AND EXISTS (
    SELECT 1 FROM public.cooks c
    WHERE c.user_id = auth.uid() AND c.is_active = true
  )
);