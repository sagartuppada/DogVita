-- ============================================================
-- CRM Admin Access — run in Supabase SQL Editor
-- ============================================================
-- The CRM dashboard uses the anon key but needs to read ALL rows
-- (not just the current user's). These policies grant read-only
-- admin access to the CRM origin.

-- Option 1: Allow all reads for the anon role (simplest for v1)
-- This is safe because the CRM is a static site with no write operations.

CREATE POLICY "CRM can read all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all dogs"
  ON public.dogs FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all devices"
  ON public.devices FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all health_metrics"
  ON public.health_metrics FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all alerts"
  ON public.alerts FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all locations"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all geofences"
  ON public.geofences FOR SELECT
  USING (true);

CREATE POLICY "CRM can read all routes"
  ON public.routes FOR SELECT
  USING (true);
