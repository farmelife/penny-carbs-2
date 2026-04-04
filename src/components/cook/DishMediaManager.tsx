import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, X } from 'lucide-react';
import { useActiveStorageProvider } from '@/hooks/useStorageProviders';

interface DishImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface DishMediaManagerProps {
  cookDishId: string;
  images: DishImage[];
  youtubeVideoUrl: string | null;
}

const MAX_IMAGES = 3;

const DishMediaManager: React.FC<DishMediaManagerProps> = ({ cookDishId, images, youtubeVideoUrl }) => {
  const queryClient = useQueryClient();
  const { data: activeProvider } = useActiveStorageProvider();
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState(youtubeVideoUrl || '');
  const [savingVideo, setSavingVideo] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Build slot data: 3 slots, filled from images array by display_order
  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => {
    return images.find(img => img.display_order === i) || null;
  });

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `cook-dishes/${cookDishId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('food-items')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('food-items')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSaveUrl = async (slotIndex: number, url: string) => {
    if (!url.trim()) return;
    try {
      const existing = slots[slotIndex];
      if (existing) {
        await supabase.from('cook_dish_images').delete().eq('id', existing.id);
      }
      const { error } = await supabase.from('cook_dish_images').insert({
        cook_dish_id: cookDishId,
        image_url: url.trim(),
        display_order: slotIndex,
      });
      if (error) throw error;
      toast({ title: 'Image saved' });
      queryClient.invalidateQueries({ queryKey: ['cook-allocated-dishes'] });
    } catch (err: any) {
      toast({ title: 'Failed to save image', description: err.message, variant: 'destructive' });
    }
  };

  const handleFileUpload = async (slotIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    setUploadingSlot(slotIndex);
    try {
      const url = await uploadToSupabase(file);
      const existing = slots[slotIndex];
      if (existing) {
        await supabase.from('cook_dish_images').delete().eq('id', existing.id);
      }
      const { error } = await supabase.from('cook_dish_images').insert({
        cook_dish_id: cookDishId,
        image_url: url,
        display_order: slotIndex,
      });
      if (error) throw error;
      toast({ title: 'Image uploaded' });
      queryClient.invalidateQueries({ queryKey: ['cook-allocated-dishes'] });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemoveImage = async (slotIndex: number) => {
    const existing = slots[slotIndex];
    if (!existing) return;
    try {
      const { error } = await supabase.from('cook_dish_images').delete().eq('id', existing.id);
      if (error) throw error;
      toast({ title: 'Image removed' });
      queryClient.invalidateQueries({ queryKey: ['cook-allocated-dishes'] });
    } catch (err: any) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveVideoUrl = async () => {
    setSavingVideo(true);
    try {
      const { error } = await supabase
        .from('cook_dishes')
        .update({ youtube_video_url: videoUrl.trim() || null })
        .eq('id', cookDishId);
      if (error) throw error;
      toast({ title: 'Video URL saved' });
      queryClient.invalidateQueries({ queryKey: ['cook-allocated-dishes'] });
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setSavingVideo(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {slots.map((slot, index) => (
        <div key={index}>
          <Label className="text-xs font-medium text-foreground">
            {index === 0 ? 'Image 1 (Upload or paste URL)' : `Image ${index + 1}`}
          </Label>
          <div className="flex items-center gap-2 mt-1">
            {slot ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img src={slot.image_url} alt={`Image ${index + 1}`} className="h-10 w-10 rounded object-cover border shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{slot.image_url.split('/').pop()}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleRemoveImage(index)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Image URL or upload"
                  className="h-9 text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveUrl(index, (e.target as HTMLInputElement).value);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      handleSaveUrl(index, e.target.value);
                    }
                  }}
                />
                <input
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(index, file);
                    e.target.value = '';
                  }}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  disabled={uploadingSlot === index}
                  onClick={() => fileInputRefs.current[index]?.click()}
                >
                  {uploadingSlot === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      <div>
        <Label className="text-xs font-medium text-foreground">Video URL</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            placeholder="Paste YouTube or video link"
            className="h-9 text-sm flex-1"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onBlur={handleSaveVideoUrl}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveVideoUrl(); }}
          />
          {savingVideo && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
};

export default DishMediaManager;
