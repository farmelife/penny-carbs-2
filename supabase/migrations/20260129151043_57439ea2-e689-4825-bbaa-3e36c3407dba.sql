-- Step 20: Referral & Commission System (Indoor Events Only)
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  commission_percent NUMERIC NOT NULL DEFAULT 5,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add referral tracking to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Create referral codes table for users
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Referrals policies
CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- Referral codes policies
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active referral codes for validation" ON public.referral_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create their referral code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := UPPER(SUBSTRING(MD5(user_uuid::text || now()::text) FROM 1 FOR 8));
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 21: Update order delivery - trigger to update balances after delivery
CREATE OR REPLACE FUNCTION public.handle_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Update delivered_at timestamp
    NEW.delivered_at := now();
    
    -- Update delivery wallet if delivery staff assigned
    IF NEW.assigned_delivery_id IS NOT NULL AND NEW.delivery_amount > 0 THEN
      UPDATE public.delivery_wallets
      SET 
        collected_amount = collected_amount + NEW.delivery_amount,
        job_earnings = job_earnings + COALESCE(NEW.delivery_earnings, 0),
        updated_at = now()
      WHERE delivery_staff_id = NEW.assigned_delivery_id;
    END IF;
    
    -- Process referral commission for indoor events
    IF NEW.service_type = 'indoor_events' AND NEW.referred_by IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, order_id, commission_percent, commission_amount)
      SELECT 
        NEW.referred_by,
        NEW.id,
        5, -- 5% default commission
        (NEW.total_amount * 0.05)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.referrals WHERE order_id = NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order delivery
DROP TRIGGER IF EXISTS on_order_delivered ON public.orders;
CREATE TRIGGER on_order_delivered
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_delivered();