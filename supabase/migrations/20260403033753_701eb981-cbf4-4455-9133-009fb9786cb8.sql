
-- Repair: ensure the on_order_cancelled trigger exists
DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;

CREATE TRIGGER on_order_cancelled
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
  EXECUTE FUNCTION public.handle_order_cancellation();

-- Backfill: update any existing cancelled orders that still have non-rejected cook assignments
UPDATE public.order_assigned_cooks
SET cook_status = 'rejected', updated_at = now()
WHERE cook_status NOT IN ('rejected')
  AND order_id IN (
    SELECT id FROM public.orders WHERE status = 'cancelled'
  );
