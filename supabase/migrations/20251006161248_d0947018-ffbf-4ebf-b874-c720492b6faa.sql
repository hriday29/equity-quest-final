-- Add maintenance mode setting
INSERT INTO public.competition_settings (setting_key, setting_value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "The platform is currently undergoing maintenance. Please check back later."}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Drop the foreign key constraint that causes issues during reset
ALTER TABLE public.price_fluctuation_log
DROP CONSTRAINT IF EXISTS price_fluctuation_log_event_id_fkey;

-- Add it back with CASCADE delete
ALTER TABLE public.price_fluctuation_log
ADD CONSTRAINT price_fluctuation_log_event_id_fkey
FOREIGN KEY (event_id)
REFERENCES public.competition_events(id)
ON DELETE CASCADE;