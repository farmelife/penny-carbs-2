
CREATE TABLE public.delivery_rule_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.delivery_rules(id) ON DELETE CASCADE,
  order_above NUMERIC NOT NULL DEFAULT 0,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_rule_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view delivery rule tiers"
ON public.delivery_rule_tiers FOR SELECT USING (true);

CREATE POLICY "Admins can manage delivery rule tiers"
ON public.delivery_rule_tiers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_delivery_rule_tiers_updated_at
BEFORE UPDATE ON public.delivery_rule_tiers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_delivery_rule_tiers_rule_id ON public.delivery_rule_tiers(rule_id);
