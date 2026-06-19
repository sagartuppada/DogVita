-- ============================================================
-- DogVita Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  phone text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone)
  values (
    new.id,
    new.email,
    new.phone
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DOGS
-- ============================================================
create table if not exists public.dogs (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  breed text,
  birth_date date,
  weight_kg numeric(5,2),
  gender text,
  photo_url text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================
-- DEVICES (BLE collar pairing)
-- ============================================================
create table if not exists public.devices (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  device_name text,
  ble_mac_address text,
  firmware_version text,
  is_connected boolean default false not null,
  last_seen_at timestamptz,
  created_at timestamptz default now() not null
);

-- ============================================================
-- HEALTH METRICS (heart rate, temperature, activity)
-- ============================================================
create table if not exists public.health_metrics (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  recorded_at timestamptz default now() not null,
  heart_rate_bpm integer,
  temperature_celsius numeric(4,1),
  battery_level integer,
  activity_steps integer,
  activity_active_minutes integer,
  activity_calories integer,
  created_at timestamptz default now() not null
);

-- Index for fast time-series queries per dog
create index if not exists idx_health_metrics_dog_recorded
  on public.health_metrics (dog_id, recorded_at desc);

-- ============================================================
-- ALERTS
-- ============================================================
create type alert_severity as enum ('info', 'warning', 'critical');
create type alert_type as enum ('heart_rate', 'temperature', 'battery', 'geofence', 'activity');

create table if not exists public.alerts (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  alert_type alert_type not null,
  severity alert_severity not null,
  title text not null,
  message text not null,
  metric_value numeric(10,2),
  metric_threshold numeric(10,2),
  is_acknowledged boolean default false not null,
  acknowledged_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_alerts_owner_acknowledged
  on public.alerts (owner_id, is_acknowledged, created_at desc);
create index if not exists idx_alerts_dog
  on public.alerts (dog_id, created_at desc);

-- ============================================================
-- LOCATION TRACKING
-- ============================================================
create table if not exists public.locations (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  speed_kmh double precision,
  recorded_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_locations_dog_recorded
  on public.locations (dog_id, recorded_at desc);

-- ============================================================
-- GEOFENCES
-- ============================================================
create table if not exists public.geofences (
  id uuid default uuid_generate_v4() primary key,
  dog_id uuid references public.dogs(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer default 100 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.devices enable row level security;
alter table public.health_metrics enable row level security;
alter table public.alerts enable row level security;
alter table public.locations enable row level security;
alter table public.geofences enable row level security;

-- Profiles: users can only read/write their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Dogs: users can CRUD their own dogs
create policy "Users can view own dogs" on public.dogs
  for select using (auth.uid() = owner_id);
create policy "Users can insert own dogs" on public.dogs
  for insert with check (auth.uid() = owner_id);
create policy "Users can update own dogs" on public.dogs
  for update using (auth.uid() = owner_id);
create policy "Users can delete own dogs" on public.dogs
  for delete using (auth.uid() = owner_id);

-- Devices: users can CRUD devices for their dogs
create policy "Users can view devices for own dogs" on public.devices
  for select using (auth.uid() = (select owner_id from public.dogs where id = devices.dog_id));
create policy "Users can insert devices for own dogs" on public.devices
  for insert with check (auth.uid() = (select owner_id from public.dogs where id = devices.dog_id));
create policy "Users can update devices for own dogs" on public.devices
  for update using (auth.uid() = (select owner_id from public.dogs where id = devices.dog_id));

-- Health metrics: users can CRUD metrics for their dogs
create policy "Users can view health metrics for own dogs" on public.health_metrics
  for select using (auth.uid() = (select owner_id from public.dogs where id = health_metrics.dog_id));
create policy "Users can insert health metrics for own dogs" on public.health_metrics
  for insert with check (auth.uid() = (select owner_id from public.dogs where id = health_metrics.dog_id));
create policy "Users can delete health metrics for own dogs" on public.health_metrics
  for delete using (auth.uid() = (select owner_id from public.dogs where id = health_metrics.dog_id));

-- Alerts: users can view and acknowledge their own alerts
create policy "Users can view own alerts" on public.alerts
  for select using (auth.uid() = owner_id);
create policy "Users can update own alerts" on public.alerts
  for update using (auth.uid() = owner_id);

-- Locations: users can CRUD locations for their dogs
create policy "Users can view locations for own dogs" on public.locations
  for select using (auth.uid() = (select owner_id from public.dogs where id = locations.dog_id));
create policy "Users can insert locations for own dogs" on public.locations
  for insert with check (auth.uid() = (select owner_id from public.dogs where id = locations.dog_id));
create policy "Users can delete locations for own dogs" on public.locations
  for delete using (auth.uid() = (select owner_id from public.dogs where id = locations.dog_id));

-- Geofences: users can CRUD their own geofences
create policy "Users can view own geofences" on public.geofences
  for select using (auth.uid() = owner_id);
create policy "Users can insert own geofences" on public.geofences
  for insert with check (auth.uid() = owner_id);
create policy "Users can update own geofences" on public.geofences
  for update using (auth.uid() = owner_id);
create policy "Users can delete own geofences" on public.geofences
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- Done
-- ============================================================