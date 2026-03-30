-- =====================================================
-- CIAF Vault - Agent Tracking System
-- Agentic Execution Boundaries Support
-- Migration 003
-- =====================================================

-- =====================================================
-- 1. AGENT IDENTITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    principal_id TEXT UNIQUE NOT NULL,
    
    -- Identity Information
    principal_type TEXT NOT NULL, -- 'agent', 'service', 'human', 'system'
    display_name TEXT NOT NULL,
    
    -- Authorization
    roles TEXT[] NOT NULL DEFAULT '{}',
    attributes JSONB NOT NULL DEFAULT '{}', -- {tenant_id, environment, department, etc.}
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'revoked'
    
    -- Cryptographic Identity
    fingerprint TEXT, -- SHA-256 hash of identity attributes
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    suspended_at TIMESTAMPTZ,
    suspended_by TEXT,
    suspension_reason TEXT
);

-- Indexes for agent_identities
CREATE INDEX idx_agent_principal_id ON agent_identities(principal_id);
CREATE INDEX idx_agent_type ON agent_identities(principal_type);
CREATE INDEX idx_agent_status ON agent_identities(status);
CREATE INDEX idx_agent_attributes ON agent_identities USING GIN(attributes);
CREATE INDEX idx_agent_roles ON agent_identities USING GIN(roles);

-- =====================================================
-- 2. AGENT ACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_id TEXT UNIQUE NOT NULL,
    
    -- Who
    principal_id TEXT NOT NULL,
    principal_type TEXT NOT NULL,
    
    -- What
    action TEXT NOT NULL, -- 'approve_payment', 'read_record', etc.
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_tenant TEXT,
    
    -- How
    params JSONB NOT NULL DEFAULT '{}',
    params_hash TEXT,
    justification TEXT,
    correlation_id TEXT, -- Group related actions
    
    -- Authorization Decision
    decision BOOLEAN NOT NULL, -- true=allowed, false=denied
    reason TEXT NOT NULL,
    elevation_grant_id TEXT, -- If privilege elevation was used
    
    -- Execution Result
    executed BOOLEAN NOT NULL DEFAULT FALSE,
    result JSONB,
    error TEXT,
    execution_duration_ms INTEGER,
    
    -- Policy & Audit
    policy_obligations TEXT[] DEFAULT '{}', -- ['two_person_review', 'heightened_logging']
    receipt_id UUID, -- Link to agent_receipts
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_agent_identity FOREIGN KEY (principal_id) 
        REFERENCES agent_identities(principal_id) ON DELETE CASCADE
);

-- Indexes for agent_actions
CREATE INDEX idx_action_principal ON agent_actions(principal_id);
CREATE INDEX idx_action_timestamp ON agent_actions(timestamp DESC);
CREATE INDEX idx_action_type ON agent_actions(action);
CREATE INDEX idx_action_resource ON agent_actions(resource_id, resource_type);
CREATE INDEX idx_action_decision ON agent_actions(decision);
CREATE INDEX idx_action_correlation ON agent_actions(correlation_id);
CREATE INDEX idx_action_grant ON agent_actions(elevation_grant_id);
CREATE INDEX idx_action_metadata ON agent_actions USING GIN(metadata);

-- =====================================================
-- 3. ELEVATION GRANTS (PAM)
-- =====================================================

CREATE TABLE IF NOT EXISTS elevation_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grant_id TEXT UNIQUE NOT NULL,
    
    -- Who
    principal_id TEXT NOT NULL,
    
    -- What Privileges
    elevated_role TEXT NOT NULL,
    scope JSONB NOT NULL DEFAULT '{}', -- {actions: [], resource_types: [], max_amount: 100000}
    
    -- Approval
    approved_by TEXT NOT NULL,
    approval_ticket TEXT, -- 'INC-2024-001'
    purpose TEXT NOT NULL,
    justification TEXT,
    
    -- Validity Period
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Usage Tracking
    used_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER, -- NULL = unlimited
    last_used_at TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'
    revoked_at TIMESTAMPTZ,
    revoked_by TEXT,
    revocation_reason TEXT,
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_grant_principal FOREIGN KEY (principal_id) 
        REFERENCES agent_identities(principal_id) ON DELETE CASCADE
);

-- Indexes for elevation_grants
CREATE INDEX idx_grant_principal ON elevation_grants(principal_id);
CREATE INDEX idx_grant_status ON elevation_grants(status);
CREATE INDEX idx_grant_valid_until ON elevation_grants(valid_until);
CREATE INDEX idx_grant_granted_at ON elevation_grants(granted_at DESC);
CREATE INDEX idx_grant_ticket ON elevation_grants(approval_ticket);
CREATE INDEX idx_grant_scope ON elevation_grants USING GIN(scope);

-- =====================================================
-- 4. AGENT RECEIPTS
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id TEXT UNIQUE NOT NULL,
    
    -- Event Reference
    action_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Principal
    principal_id TEXT NOT NULL,
    principal_type TEXT NOT NULL,
    
    -- Action Context
    action TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    correlation_id TEXT,
    
    -- Authorization
    decision BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    elevation_grant_id TEXT,
    approved_by TEXT, -- If elevated
    
    -- Cryptographic Evidence
    params_hash TEXT NOT NULL,
    prior_receipt_hash TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    receipt_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    signature_algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
    
    -- Policy
    policy_obligations TEXT[] DEFAULT '{}',
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Chain Tracking
    chain_sequence INTEGER,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_receipt_action FOREIGN KEY (action_id) 
        REFERENCES agent_actions(action_id) ON DELETE CASCADE,
    CONSTRAINT fk_receipt_principal FOREIGN KEY (principal_id) 
        REFERENCES agent_identities(principal_id) ON DELETE CASCADE
);

-- Indexes for agent_receipts
CREATE INDEX idx_receipt_action ON agent_receipts(action_id);
CREATE INDEX idx_receipt_principal ON agent_receipts(principal_id);
CREATE INDEX idx_receipt_timestamp ON agent_receipts(timestamp DESC);
CREATE INDEX idx_receipt_correlation ON agent_receipts(correlation_id);
CREATE INDEX idx_receipt_chain ON agent_receipts(chain_sequence);
CREATE INDEX idx_receipt_prior_hash ON agent_receipts(prior_receipt_hash);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update grant status based on expiry
CREATE OR REPLACE FUNCTION update_grant_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND NEW.valid_until < NOW() THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-expire grants
CREATE TRIGGER trigger_grant_expiry
    BEFORE UPDATE ON elevation_grants
    FOR EACH ROW
    EXECUTE FUNCTION update_grant_status();

-- Function to increment grant usage count
CREATE OR REPLACE FUNCTION increment_grant_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.elevation_grant_id IS NOT NULL THEN
        UPDATE elevation_grants
        SET used_count = used_count + 1,
            last_used_at = NOW()
        WHERE grant_id = NEW.elevation_grant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track grant usage
CREATE TRIGGER trigger_track_grant_usage
    AFTER INSERT ON agent_actions
    FOR EACH ROW
    WHEN (NEW.elevation_grant_id IS NOT NULL)
    EXECUTE FUNCTION increment_grant_usage();

-- =====================================================
-- 6. VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active agents with recent activity
CREATE OR REPLACE VIEW active_agents_summary AS
SELECT 
    ai.principal_id,
    ai.display_name,
    ai.principal_type,
    ai.roles,
    ai.status,
    ai.attributes->>'tenant_id' as tenant_id,
    COUNT(DISTINCT aa.id) as total_actions,
    COUNT(DISTINCT aa.id) FILTER (WHERE aa.decision = TRUE) as actions_allowed,
    COUNT(DISTINCT aa.id) FILTER (WHERE aa.decision = FALSE) as actions_denied,
    MAX(aa.timestamp) as last_action_at,
    COUNT(DISTINCT eg.id) FILTER (WHERE eg.status = 'active') as active_grants
FROM agent_identities ai
LEFT JOIN agent_actions aa ON ai.principal_id = aa.principal_id
LEFT JOIN elevation_grants eg ON ai.principal_id = eg.principal_id
WHERE ai.status = 'active'
GROUP BY ai.principal_id, ai.display_name, ai.principal_type, ai.roles, 
         ai.status, ai.attributes;

-- Recent agent violations (denied actions)
CREATE OR REPLACE VIEW recent_violations AS
SELECT 
    aa.action_id,
    aa.principal_id,
    ai.display_name,
    aa.action,
    aa.resource_type,
    aa.resource_id,
    aa.reason,
    aa.timestamp,
    aa.correlation_id
FROM agent_actions aa
JOIN agent_identities ai ON aa.principal_id = ai.principal_id
WHERE aa.decision = FALSE
ORDER BY aa.timestamp DESC
LIMIT 100;

-- Active elevation grants
CREATE OR REPLACE VIEW active_elevations AS
SELECT 
    eg.grant_id,
    eg.principal_id,
    ai.display_name,
    eg.elevated_role,
    eg.scope,
    eg.approved_by,
    eg.purpose,
    eg.valid_from,
    eg.valid_until,
    eg.used_count,
    eg.max_uses,
    eg.approval_ticket
FROM elevation_grants eg
JOIN agent_identities ai ON eg.principal_id = ai.principal_id
WHERE eg.status = 'active'
  AND eg.valid_until > NOW()
ORDER BY eg.valid_until ASC;

-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Example: Insert a sample agent
-- INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes)
-- VALUES (
--     'agent-payment-001',
--     'agent',
--     'Payment Approval Agent',
--     ARRAY['payment_approver', 'financial_analyst'],
--     '{"tenant_id": "acme-corp", "environment": "production", "department": "finance"}'::jsonb
-- );

-- =====================================================
-- Migration Complete
-- =====================================================

-- Record migration
COMMENT ON TABLE agent_identities IS 'CIAF Agent Identity Registry - tracks all AI agent principals';
COMMENT ON TABLE agent_actions IS 'CIAF Agent Action Log - complete audit trail of agent executions';
COMMENT ON TABLE elevation_grants IS 'CIAF Privilege Elevation Grants - PAM-style temporary privilege escalation';
COMMENT ON TABLE agent_receipts IS 'CIAF Agent Cryptographic Receipts - tamper-evident evidence chains';
