-- DamuLink Database Schema
-- Run this in the Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  county TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  contact_phone TEXT NOT NULL,
  trust_score NUMERIC(3,1) DEFAULT 5.0 CHECK (trust_score >= 0 AND trust_score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available INTEGER NOT NULL CHECK (units_available >= 0),
  expiry_timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','dispatched','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  receiver_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_requested INTEGER NOT NULL CHECK (units_requested > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','declined','in_transit','delivered','cancelled')),
  confidence_score NUMERIC(4,3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surgical_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  blood_type_needed TEXT NOT NULL CHECK (blood_type_needed IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed INTEGER NOT NULL CHECK (units_needed > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  blood_unit_id UUID REFERENCES blood_units(id) ON DELETE SET NULL,
  match_id UUID REFERENCES match_requests(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  county TEXT NOT NULL,
  last_donated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_blood_units_expiry ON blood_units (expiry_timestamp);
CREATE INDEX IF NOT EXISTS idx_blood_units_blood_type ON blood_units (blood_type);
CREATE INDEX IF NOT EXISTS idx_blood_units_status ON blood_units (status);
CREATE INDEX IF NOT EXISTS idx_facilities_county ON facilities (county);
CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests (status);
CREATE INDEX IF NOT EXISTS idx_match_requests_donor ON match_requests (donor_facility_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_receiver ON match_requests (receiver_facility_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_surgical_scheduled_at ON surgical_schedules (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_donors_blood_type_county ON donors (blood_type, county);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgical_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

-- Public read policies (authenticated users can read all data)
CREATE POLICY "Authenticated users can read facilities"
  ON facilities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read blood_units"
  ON blood_units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read match_requests"
  ON match_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read surgical_schedules"
  ON surgical_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read audit_log"
  ON audit_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read donors"
  ON donors FOR SELECT TO authenticated USING (true);

-- Write policies (authenticated users can insert/update their own data)
CREATE POLICY "Authenticated users can insert blood_units"
  ON blood_units FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update blood_units"
  ON blood_units FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert match_requests"
  ON match_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update match_requests"
  ON match_requests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert surgical_schedules"
  ON surgical_schedules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete surgical_schedules"
  ON surgical_schedules FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit_log"
  ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert donors"
  ON donors FOR INSERT TO authenticated WITH CHECK (true);

-- Service role bypass (for API routes)
CREATE POLICY "Service role can do anything on facilities"
  ON facilities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on blood_units"
  ON blood_units FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on match_requests"
  ON match_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on surgical_schedules"
  ON surgical_schedules FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on audit_log"
  ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on donors"
  ON donors FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update match_requests.updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_requests_updated_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
