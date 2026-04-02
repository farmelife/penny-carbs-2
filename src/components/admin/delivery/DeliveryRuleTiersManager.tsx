import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useDeliveryRules, type DeliveryRuleTier } from '@/hooks/useDeliveryRules';

interface Props {
  ruleId: string;
  tiers: DeliveryRuleTier[];
}

const DeliveryRuleTiersManager: React.FC<Props> = ({ ruleId, tiers }) => {
  const { addTier, deleteTier } = useDeliveryRules();
  const [orderAbove, setOrderAbove] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');

  const handleAdd = () => {
    const above = Number(orderAbove);
    const charge = Number(deliveryCharge);
    if (isNaN(above) || above < 0) return;

    addTier.mutate({
      rule_id: ruleId,
      order_above: above,
      delivery_charge: isNaN(charge) ? 0 : charge,
      display_order: tiers.length,
    }, {
      onSuccess: () => {
        setOrderAbove('');
        setDeliveryCharge('');
      },
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Threshold Tiers</h4>
      <p className="text-xs text-muted-foreground">
        When order amount exceeds a threshold, the matching tier's delivery charge applies. Highest matching tier wins. Set charge to 0 for free delivery.
      </p>

      {tiers.length > 0 && (
        <div className="space-y-2">
          {tiers.map(tier => (
            <div key={tier.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2">
              <span className="flex-1">
                Above <strong>₹{tier.order_above}</strong> → {tier.delivery_charge === 0 ? <span className="text-green-600 font-medium">Free</span> : <strong>₹{tier.delivery_charge}</strong>}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteTier.mutate(tier.id)}
                disabled={deleteTier.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Order Above (₹)</Label>
          <Input
            type="number"
            min="0"
            placeholder="e.g. 500"
            value={orderAbove}
            onChange={(e) => setOrderAbove(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Delivery Charge (₹)</Label>
          <Input
            type="number"
            min="0"
            placeholder="0 = Free"
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={addTier.isPending || !orderAbove}>
          {addTier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default DeliveryRuleTiersManager;
