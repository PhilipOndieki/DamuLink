-- DamuLink Seed Data
-- 5 test facilities across 3 counties in Kenya

INSERT INTO facilities (id, name, county, lat, lng, contact_phone, trust_score) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Kenyatta National Hospital', 'Nairobi', -1.3031, 36.8082, '+254700111001', 9.5),
  ('11111111-0000-0000-0000-000000000002', 'Nairobi Hospital', 'Nairobi', -1.2997, 36.8050, '+254700111002', 8.7),
  ('11111111-0000-0000-0000-000000000003', 'Mater Hospital', 'Nairobi', -1.3090, 36.8370, '+254700111003', 8.2),
  ('11111111-0000-0000-0000-000000000004', 'Mombasa County Hospital', 'Mombasa', -4.0435, 39.6682, '+254700111004', 7.9),
  ('11111111-0000-0000-0000-000000000005', 'Kisumu County Referral Hospital', 'Kisumu', -0.1022, 34.7617, '+254700111005', 8.1)
ON CONFLICT (id) DO NOTHING;

-- Blood units: mix of expiry windows
INSERT INTO blood_units (facility_id, blood_type, units_available, expiry_timestamp, status) VALUES
  -- KNH: O+ expiring in 8 hours (critical)
  ('11111111-0000-0000-0000-000000000001', 'O+', 4, NOW() + INTERVAL '8 hours', 'available'),
  -- KNH: A- expiring in 30 hours
  ('11111111-0000-0000-0000-000000000001', 'A-', 2, NOW() + INTERVAL '30 hours', 'available'),
  -- KNH: B+ expiring in 5 days
  ('11111111-0000-0000-0000-000000000001', 'B+', 6, NOW() + INTERVAL '5 days', 'available'),
  -- Nairobi Hospital: AB+ expiring in 10 hours
  ('11111111-0000-0000-0000-000000000002', 'AB+', 1, NOW() + INTERVAL '10 hours', 'available'),
  -- Nairobi Hospital: O- expiring in 2 days
  ('11111111-0000-0000-0000-000000000002', 'O-', 3, NOW() + INTERVAL '2 days', 'available'),
  -- Mater: A+ expiring in 48 hours
  ('11111111-0000-0000-0000-000000000003', 'A+', 5, NOW() + INTERVAL '48 hours', 'available'),
  -- Mater: B- expiring in 20 hours
  ('11111111-0000-0000-0000-000000000003', 'B-', 2, NOW() + INTERVAL '20 hours', 'available'),
  -- Mombasa: O+ expiring in 6 hours (critical)
  ('11111111-0000-0000-0000-000000000004', 'O+', 3, NOW() + INTERVAL '6 hours', 'available'),
  -- Kisumu: AB- expiring in 15 hours
  ('11111111-0000-0000-0000-000000000005', 'AB-', 2, NOW() + INTERVAL '15 hours', 'available');

-- Surgical schedules
INSERT INTO surgical_schedules (facility_id, procedure_name, scheduled_at, blood_type_needed, units_needed) VALUES
  ('11111111-0000-0000-0000-000000000002', 'Cardiac Bypass Surgery', NOW() + INTERVAL '6 hours', 'O+', 4),
  ('11111111-0000-0000-0000-000000000003', 'Emergency Splenectomy', NOW() + INTERVAL '3 hours', 'B-', 2),
  ('11111111-0000-0000-0000-000000000004', 'Hip Replacement', NOW() + INTERVAL '24 hours', 'A+', 3),
  ('11111111-0000-0000-0000-000000000005', 'Liver Resection', NOW() + INTERVAL '12 hours', 'AB-', 2),
  ('11111111-0000-0000-0000-000000000001', 'Kidney Transplant', NOW() + INTERVAL '48 hours', 'O-', 4);

-- Sample match requests
INSERT INTO match_requests (donor_facility_id, receiver_facility_id, blood_type, units_requested, status, confidence_score) VALUES
  ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'O+', 4, 'pending', 0.875),
  ('11111111-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'B-', 2, 'confirmed', 0.720);

-- Sample donors
INSERT INTO donors (name, phone, blood_type, county, last_donated_at) VALUES
  ('James Mwangi', '+254700222001', 'O+', 'Nairobi', NOW() - INTERVAL '3 months'),
  ('Faith Njeri', '+254700222002', 'A-', 'Nairobi', NOW() - INTERVAL '6 months'),
  ('Brian Otieno', '+254700222003', 'B+', 'Kisumu', NOW() - INTERVAL '4 months'),
  ('Amina Hassan', '+254700222004', 'O-', 'Mombasa', NOW() - INTERVAL '2 months'),
  ('David Kamau', '+254700222005', 'AB+', 'Nairobi', NOW() - INTERVAL '5 months'),
  ('Grace Wanjiku', '+254700222006', 'O+', 'Nairobi', NOW() - INTERVAL '1 month'),
  ('Samuel Kipchoge', '+254700222007', 'A+', 'Nakuru', NOW() - INTERVAL '7 months'),
  ('Lucy Achieng', '+254700222008', 'B-', 'Kisumu', NOW() - INTERVAL '3 months');

-- Audit log entries
INSERT INTO audit_log (event_type, facility_id, notes) VALUES
  ('facility_registered', '11111111-0000-0000-0000-000000000001', 'Kenyatta National Hospital onboarded'),
  ('facility_registered', '11111111-0000-0000-0000-000000000002', 'Nairobi Hospital onboarded'),
  ('facility_registered', '11111111-0000-0000-0000-000000000003', 'Mater Hospital onboarded'),
  ('facility_registered', '11111111-0000-0000-0000-000000000004', 'Mombasa County Hospital onboarded'),
  ('facility_registered', '11111111-0000-0000-0000-000000000005', 'Kisumu County Referral Hospital onboarded');
