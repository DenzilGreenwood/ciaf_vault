-- =====================================================
-- CIAF Vault - Drop Development RLS Policies
-- Migration 005
-- =====================================================

DROP POLICY IF EXISTS "Allow all reads" ON events_core;
DROP POLICY IF EXISTS "Allow all reads" ON events_web;
DROP POLICY IF EXISTS "Allow all reads" ON compliance_events;
DROP POLICY IF EXISTS "Allow all reads" ON receipts;
DROP POLICY IF EXISTS "Allow all reads" ON training_snapshots;
DROP POLICY IF EXISTS "Allow all reads" ON audit_trails;
DROP POLICY IF EXISTS "Allow all reads" ON agent_identities;

-- =====================================================
-- Migration Complete
-- =====================================================

COMMENT ON SCHEMA public IS 'Development policies removed - production RLS policies should be configured per table';
