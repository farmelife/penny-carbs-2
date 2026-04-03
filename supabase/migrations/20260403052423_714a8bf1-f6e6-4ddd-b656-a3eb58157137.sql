
CREATE TABLE public.storage_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.storage_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins and admins can manage storage providers"
  ON public.storage_providers FOR ALL
  TO public
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_storage_providers_updated_at
  BEFORE UPDATE ON public.storage_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
