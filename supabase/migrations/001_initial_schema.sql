-- =====================================================
-- CIAF Vault Database Schema
-- Supabase/PostgreSQL Schema for AI Lifecycle Events
-- © 2025 Denzil James Greenwood
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CORE AI MODEL LIFECYCLE EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS events_core (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Model Information
    model_name TEXT NOT NULL,
    model_version TEXT,
    
    -- Event Classification
    event_type TEXT NOT NULL, -- 'training', 'inference', 'deployment', 'monitoring'
    stage TEXT NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
    lcm_stage TEXT, -- LCM stage identifier
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Provenance & Audit
    parent_event_id TEXT,
    receipt_id UUID,
    merkle_root TEXT,
    content_hash TEXT,
    
    -- Training Snapshots
    training_snapshot_id UUID,
    
    -- Indexing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Organization/User Context
    org_id TEXT,
    user_id TEXT,
    
    CONSTRAINT fk_parent_event FOREIGN KEY (parent_event_id) 
        REFERENCES events_core(event_id) ON DELETE SET NULL
);

-- Indexes for events_core
CREATE INDEX idx_events_core_timestamp ON events_core(timestamp DESC);
CREATE INDEX idx_events_core_model_name ON events_core(model_name);
CREATE INDEX idx_events_core_event_type ON events_core(event_type);
CREATE INDEX idx_events_core_stage ON events_core(stage);
CREATE INDEX idx_events_core_org_id ON events_core(org_id);
CREATE INDEX idx_events_core_receipt_id ON events_core(receipt_id);
CREATE INDEX idx_events_core_metadata ON events_core USING GIN(metadata);

-- =====================================================
-- 2. WEB AI GOVERNANCE EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS events_web (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User/Org Context
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT,
    
    -- Tool Information
    tool_name TEXT NOT NULL,
    tool_category TEXT, -- 'chatbot', 'code_generator', 'image_generator', etc.
    tool_url TEXT,
    
    -- Event Classification
    event_type TEXT NOT NULL, -- 'tool_detected', 'content_submitted', 'policy_violation', 'blocked'
    
    -- Policy & Compliance
    policy_decision TEXT NOT NULL, -- 'allow', 'warn', 'block'
    policy_rule_id TEXT,
    sensitivity_score NUMERIC(3,2), -- 0.00 to 1.00
    
    -- Shadow AI Detection
    is_shadow_ai BOOLEAN DEFAULT FALSE,
    detection_method TEXT,
    
    -- Content Analysis
    content_hash TEXT,
    content_summary TEXT,
    pii_detected BOOLEAN DEFAULT FALSE,
    pii_types TEXT[],
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Receipt & Audit
    receipt_id UUID,
    
    -- Indexing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_sensitivity_score CHECK (sensitivity_score >= 0 AND sensitivity_score <= 1)
);

-- Indexes for events_web
CREATE INDEX idx_events_web_timestamp ON events_web(timestamp DESC);
CREATE INDEX idx_events_web_org_id ON events_web(org_id);
CREATE INDEX idx_events_web_user_id ON events_web(user_id);
CREATE INDEX idx_events_web_tool_name ON events_web(tool_name);
CREATE INDEX idx_events_web_event_type ON events_web(event_type);
CREATE INDEX idx_events_web_policy_decision ON events_web(policy_decision);
CREATE INDEX idx_events_web_shadow_ai ON events_web(is_shadow_ai) WHERE is_shadow_ai = TRUE;
CREATE INDEX idx_events_web_metadata ON events_web USING GIN(metadata);

-- =====================================================
-- 3. CRYPTOGRAPHIC RECEIPTS
-- =====================================================

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Event Reference
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'core' or 'web'
    
    -- Cryptographic Data
    content_hash TEXT NOT NULL,
    merkle_root TEXT NOT NULL,
    merkle_proof JSONB,
    
    -- Chain Information
    previous_receipt_id TEXT,
    chain_sequence INTEGER,
    
    -- Signature
    signature TEXT,
    signature_algorithm TEXT DEFAULT 'ed25519',
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for receipts
CREATE INDEX idx_receipts_receipt_id ON receipts(receipt_id);
CREATE INDEX idx_receipts_event_id ON receipts(event_id);
CREATE INDEX idx_receipts_timestamp ON receipts(timestamp DESC);
CREATE INDEX idx_receipts_chain_sequence ON receipts(chain_sequence);

-- =====================================================
-- 4. COMPLIANCE EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Compliance Framework
    framework TEXT NOT NULL, -- 'GDPR', 'HIPAA', 'SOC2', 'ISO27001', etc.
    control_id TEXT NOT NULL,
    control_description TEXT,
    
    -- Compliance Status
    status TEXT NOT NULL, -- 'compliant', 'violation', 'warning', 'pending'
    severity TEXT, -- 'critical', 'high', 'medium', 'low'
    
    -- Related Event
    source_event_id TEXT,
    source_event_type TEXT, -- 'core' or 'web'
    
    -- Details
    finding TEXT,
    remediation_required BOOLEAN DEFAULT FALSE,
    remediation_steps TEXT,
    
    -- Risk Assessment
    risk_level TEXT, -- 'critical', 'high', 'medium', 'low'
    risk_score NUMERIC(3,2),
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

-- Indexes for compliance_events
CREATE INDEX idx_compliance_timestamp ON compliance_events(timestamp DESC);
CREATE INDEX idx_compliance_framework ON compliance_events(framework);
CREATE INDEX idx_compliance_status ON compliance_events(status);
CREATE INDEX idx_compliance_severity ON compliance_events(severity);
CREATE INDEX idx_compliance_source_event ON compliance_events(source_event_id);

-- =====================================================
-- 5. AUDIT TRAILS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Action Information
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'export'
    resource_type TEXT NOT NULL, -- 'event', 'receipt', 'compliance'
    resource_id TEXT NOT NULL,
    
    -- Actor Information
    actor_id TEXT NOT NULL,
    actor_type TEXT NOT NULL, -- 'user', 'system', 'api'
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Changes
    old_value JSONB,
    new_value JSONB,
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit_trails
CREATE INDEX idx_audit_timestamp ON audit_trails(timestamp DESC);
CREATE INDEX idx_audit_actor_id ON audit_trails(actor_id);
CREATE INDEX idx_audit_resource ON audit_trails(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_trails(action);

-- =====================================================
-- 6. TRAINING SNAPSHOTS
-- =====================================================

CREATE TABLE IF NOT EXISTS training_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Model Information
    model_name TEXT NOT NULL,
    model_version TEXT,
    
    -- Training Details
    epoch INTEGER,
    step INTEGER,
    
    -- Metrics
    metrics JSONB NOT NULL DEFAULT '{}', -- loss, accuracy, etc.
    
    -- Data
    dataset_hash TEXT,
    dataset_name TEXT,
    dataset_version TEXT,
    
    -- Hyperparameters
    hyperparameters JSONB NOT NULL DEFAULT '{}',
    
    -- Artifacts
    checkpoint_path TEXT,
    artifact_hash TEXT,
    
    -- Related Event
    event_id TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_training_event FOREIGN KEY (event_id) 
        REFERENCES events_core(event_id) ON DELETE SET NULL
);

-- Indexes for training_snapshots
CREATE INDEX idx_training_timestamp ON training_snapshots(timestamp DESC);
CREATE INDEX idx_training_model_name ON training_snapshots(model_name);
CREATE INDEX idx_training_event_id ON training_snapshots(event_id);

-- =====================================================
-- 7. MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Daily event statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_event_stats AS
SELECT 
    DATE(timestamp) as event_date,
    'core' as event_source,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT model_name) as unique_models,
    COUNT(DISTINCT org_id) as unique_orgs
FROM events_core
GROUP BY DATE(timestamp), event_type

UNION ALL

SELECT 
    DATE(timestamp) as event_date,
    'web' as event_source,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT tool_name) as unique_tools,
    COUNT(DISTINCT org_id) as unique_orgs
FROM events_web
GROUP BY DATE(timestamp), event_type;

-- Create index on materialized view
CREATE INDEX idx_daily_stats_date ON daily_event_stats(event_date DESC);

-- Shadow AI summary
CREATE MATERIALIZED VIEW IF NOT EXISTS shadow_ai_summary AS
SELECT 
    org_id,
    tool_name,
    COUNT(*) as detection_count,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(timestamp) as last_detected,
    AVG(sensitivity_score) as avg_sensitivity
FROM events_web
WHERE is_shadow_ai = TRUE
GROUP BY org_id, tool_name;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE events_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_snapshots ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy for org isolation (customize based on your auth setup)
-- Users can only see events from their organization

CREATE POLICY "Users can view their org's core events"
    ON events_core FOR SELECT
    USING (org_id = current_setting('app.current_org_id', TRUE));

CREATE POLICY "Users can view their org's web events"
    ON events_web FOR SELECT
    USING (org_id = current_setting('app.current_org_id', TRUE));

-- Admin bypass policy (for service role)
CREATE POLICY "Service role bypass"
    ON events_core FOR ALL
    USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role bypass web"
    ON events_web FOR ALL
    USING (current_setting('role') = 'service_role');

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for events_core
CREATE TRIGGER update_events_core_updated_at
    BEFORE UPDATE ON events_core
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_event_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY shadow_ai_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. PARTITIONING FOR SCALABILITY
-- =====================================================

-- Partition events_core by month (for better performance at scale)
-- This is optional but recommended for high-volume deployments

-- Example: Create partitions for 2026
-- CREATE TABLE events_core_2026_01 PARTITION OF events_core
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- 
-- CREATE TABLE events_core_2026_02 PARTITION OF events_core
--     FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- 
-- Add more partitions as needed, or automate with pg_partman extension

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
