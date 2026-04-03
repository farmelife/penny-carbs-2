

## Problem

When a customer cancels an order, only `orders.status` is updated to `cancelled`. The `order_assigned_cooks` table (which the cook dashboard reads) still has `cook_status` as `pending`/`accepted`/`preparing`/`cooked`. The cook dashboard query filters by `order_assigned_cooks.cook_status` and never checks the parent order's `status`, so cancelled orders remain visible to cooks.

## Solution

Two-pronged fix for reliability:

### 1. Database trigger (migration)
Create a trigger on the `orders` table that automatically updates all related `order_assigned_cooks` rows to `rejected` (or a new status) when an order is cancelled:

```sql
CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.order_assigned_cooks
    SET cook_status = 'rejected'
    WHERE order_id = NEW.id
      AND cook_status NOT IN ('rejected');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_order_cancelled
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
  EXECUTE FUNCTION public.handle_order_cancellation();
```

### 2. Frontend filter (defense in depth)
Update `useCookOrders` in `src/hooks/useCook.ts` to also fetch `orders.status` and filter out orders where the parent order status is `cancelled`. This handles any existing stale data.

- In the orders query (~line 77), add `status` to the select fields
- After merging, filter out orders where `order.status === 'cancelled'`

### Files changed
- **New migration**: trigger to sync cancellation to `order_assigned_cooks`
- **Edit**: `src/hooks/useCook.ts` — add `status` field to query and filter cancelled orders

