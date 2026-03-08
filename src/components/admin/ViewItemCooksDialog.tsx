import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Phone, MapPin } from 'lucide-react';

interface ViewItemCooksDialogProps {
  foodItemId: string;
  foodItemName: string;
  trigger: React.ReactNode;
}

const ViewItemCooksDialog: React.FC<ViewItemCooksDialogProps> = ({
  foodItemId,
  foodItemName,
  trigger,
}) => {
  const [open, setOpen] = useState(false);

  const { data: cooks, isLoading } = useQuery({
    queryKey: ['item-cooks', foodItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cook_dishes')
        .select(`
          id, custom_price, is_coming_soon,
          cook:cooks(id, kitchen_name, mobile_number, is_active, is_available, panchayat:panchayats(name))
        `)
        .eq('food_item_id', foodItemId);

      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: open,
  });

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Cooks for "{foodItemName}"
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : !cooks?.length ? (
              <div className="py-8 text-center text-muted-foreground">
                <ChefHat className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>No cooks assigned to this item</p>
              </div>
            ) : (
              cooks.map((cd) => (
                <div
                  key={cd.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{cd.cook?.kitchen_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cd.cook?.mobile_number}
                      </span>
                      {cd.cook?.panchayat?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cd.cook.panchayat.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cd.custom_price != null && (
                      <Badge variant="outline" className="text-xs">
                        ₹{cd.custom_price}
                      </Badge>
                    )}
                    {cd.is_coming_soon && (
                      <Badge variant="secondary" className="text-xs">Soon</Badge>
                    )}
                    <Badge
                      variant={cd.cook?.is_active && cd.cook?.is_available ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {cd.cook?.is_active && cd.cook?.is_available ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {cooks?.length ?? 0} cook(s) assigned
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewItemCooksDialog;
