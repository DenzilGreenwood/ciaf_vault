-- =====================================================
-- CIAF Vault - Agent Tracking Sample Data
-- Test data for Agentic Execution Boundaries
-- Migration 004
-- =====================================================

-- =====================================================
-- 1. AGENT IDENTITIES
-- =====================================================

-- Payment Approval Agent (Full privileges)
INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes, fingerprint, status, created_by)
VALUES (
    'agent-payment-001',
    'agent',
    'Payment Approval Agent',
    ARRAY['payment_approver', 'financial_analyst', 'viewer'],
    '{"tenant_id": "acme-corp", "environment": "production", "department": "finance", "criticality": "high"}'::jsonb,
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    'active',
    'system-admin'
);

-- Data Analytics Agent (Read-only)
INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes, fingerprint, status, created_by)
VALUES (
    'agent-analytics-002',
    'agent',
    'Data Analytics Agent',
    ARRAY['viewer', 'analyst'],
    '{"tenant_id": "acme-corp", "environment": "production", "department": "analytics", "criticality": "medium"}'::jsonb,
    'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7',
    'active',
    'system-admin'
);

-- ML Model Deployment Agent
INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes, fingerprint, status, created_by)
VALUES (
    'agent-ml-deploy-003',
    'agent',
    'ML Model Deployment Agent',
    ARRAY['ml_engineer', 'deployment_admin', 'viewer'],
    '{"tenant_id": "acme-corp", "environment": "production", "department": "ml-ops", "criticality": "high"}'::jsonb,
    'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8',
    'active',
    'ml-team-lead'
);

-- Compliance Auditor Service
INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes, fingerprint, status, created_by)
VALUES (
    'service-compliance-audit',
    'service',
    'Compliance Audit Service',
    ARRAY['compliance_officer', 'data_steward', 'viewer'],
    '{"tenant_id": "acme-corp", "environment": "production", "department": "compliance", "criticality": "critical"}'::jsonb,
    'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9',
    'active',
    'compliance-director'
);

-- Suspended Agent (for testing)
INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes, fingerprint, status, created_by, suspended_at, suspended_by, suspension_reason)
VALUES (
    'agent-suspended-004',
    'agent',
    'Suspended Test Agent',
    ARRAY['viewer'],
    '{"tenant_id": "test-corp", "environment": "staging", "department": "testing"}'::jsonb,
    'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0',
    'suspended',
    'test-admin',
    NOW() - INTERVAL '5 days',
    'security-team',
    'Policy violations detected during audit'
);

-- Human User (for testing mixed principals)
INSERT INTO agent_identities (principal_id, principal_type, display_name, roles, attributes, fingerprint, status, created_by)
VALUES (
    'human-alice-001',
    'human',
    'Alice Johnson (CFO)',
    ARRAY['admin', 'payment_approver', 'financial_analyst'],
    '{"tenant_id": "acme-corp", "environment": "production", "department": "finance", "title": "CFO"}'::jsonb,
    'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1',
    'active',
    'hr-system'
);

-- =====================================================
-- 2. ELEVATION GRANTS (PAM)
-- =====================================================

-- Active grant for analytics agent to temporarily access PII
INSERT INTO elevation_grants (
    grant_id, principal_id, elevated_role, scope, approved_by, 
    approval_ticket, purpose, justification, valid_from, valid_until, 
    max_uses, status, metadata
)
VALUES (
    'grant-2026-001',
    'agent-analytics-002',
    'data_steward',
    '{"actions": ["access_pii", "read"], "resource_types": ["customer_record", "transaction"], "max_records": 1000}'::jsonb,
    'human-alice-001',
    'JIRA-2026-123',
    'Q1 2026 Customer Behavior Analysis',
    'Need to analyze customer transaction patterns for quarterly report. Limited to aggregated data only.',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '6 hours',
    50,
    'active',
    '{"approved_date": "2026-03-29", "audit_required": true}'::jsonb
);

-- Expiring grant for payment agent (short-term privilege escalation)
INSERT INTO elevation_grants (
    grant_id, principal_id, elevated_role, scope, approved_by, 
    approval_ticket, purpose, justification, valid_from, valid_until, 
    max_uses, used_count, last_used_at, status, metadata
)
VALUES (
    'grant-2026-002',
    'agent-payment-001',
    'admin',
    '{"actions": ["approve_payment", "delete"], "resource_types": ["payment"], "max_amount": 100000}'::jsonb,
    'human-alice-001',
    'INC-2026-456',
    'Emergency payment processing during system outage',
    'Primary payment system down. Need elevated access for manual approvals.',
    NOW() - INTERVAL '3 hours',
    NOW() + INTERVAL '1 hour',
    10,
    3,
    NOW() - INTERVAL '30 minutes',
    'active',
    '{"emergency": true, "incident_severity": "high"}'::jsonb
);

-- Expired grant (for testing)
INSERT INTO elevation_grants (
    grant_id, principal_id, elevated_role, scope, approved_by, 
    approval_ticket, purpose, justification, valid_from, valid_until, 
    max_uses, used_count, status, metadata
)
VALUES (
    'grant-2026-003',
    'agent-ml-deploy-003',
    'deployment_admin',
    '{"actions": ["deploy_model"], "resource_types": ["model"], "environments": ["production"]}'::jsonb,
    'human-alice-001',
    'JIRA-2026-789',
    'Deploy fraud detection model v2.3.1',
    'Critical security patch for fraud detection system.',
    NOW() - INTERVAL '48 hours',
    NOW() - INTERVAL '24 hours',
    5,
    5,
    'expired',
    '{"deployment_completed": true, "model_version": "2.3.1"}'::jsonb
);

-- =====================================================
-- 3. AGENT ACTIONS
-- =====================================================

-- Successful payment approval
INSERT INTO agent_actions (
    action_id, principal_id, principal_type, action, resource_id, resource_type, 
    resource_tenant, params, params_hash, justification, correlation_id, 
    decision, reason, elevation_grant_id, executed, result, 
    policy_obligations, metadata, timestamp
)
VALUES (
    'action-2026-001',
    'agent-payment-001',
    'agent',
    'approve_payment',
    'payment-12345',
    'payment',
    'acme-corp',
    '{"amount": 50000, "currency": "USD", "recipient": "vendor-xyz", "invoice": "INV-2026-001"}'::jsonb,
    'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    'Approved vendor invoice for Q1 software licenses',
    'workflow-payment-batch-001',
    TRUE,
    'Agent has required role for action ''approve_payment''',
    NULL,
    TRUE,
    '{"status": "approved", "approval_code": "APV-2026-001", "processed_at": "2026-03-29T10:30:00Z"}'::jsonb,
    ARRAY['require_audit', 'financial_reporting'],
    '{"ip_address": "10.0.1.45", "user_agent": "CIAF-Agent/1.3.2"}'::jsonb,
    NOW() - INTERVAL '2 hours'
);

-- Denied action - insufficient privileges
INSERT INTO agent_actions (
    action_id, principal_id, principal_type, action, resource_id, resource_type, 
    resource_tenant, params, params_hash, justification, correlation_id, 
    decision, reason, elevation_grant_id, executed, 
    policy_obligations, metadata, timestamp
)
VALUES (
    'action-2026-002',
    'agent-analytics-002',
    'agent',
    'delete',
    'record-67890',
    'customer_record',
    'acme-corp',
    '{"record_id": "67890", "reason": "data_cleanup"}'::jsonb,
    'def456ghi789jkl012mno345pqr678stu901vwx234yz567',
    'Attempting to delete outdated customer record',
    'cleanup-job-daily-001',
    FALSE,
    'Agent lacks required role for action ''delete''. Required: admin',
    NULL,
    FALSE,
    ARRAY['heightened_logging'],
    '{"ip_address": "10.0.1.46", "user_agent": "CIAF-Agent/1.3.2"}'::jsonb,
    NOW() - INTERVAL '90 minutes'
);

-- Successful action with elevation grant
INSERT INTO agent_actions (
    action_id, principal_id, principal_type, action, resource_id, resource_type, 
    resource_tenant, params, params_hash, justification, correlation_id, 
    decision, reason, elevation_grant_id, executed, result, 
    policy_obligations, metadata, timestamp
)
VALUES (
    'action-2026-003',
    'agent-analytics-002',
    'agent',
    'access_pii',
    'customer-analysis-q1-2026',
    'customer_record',
    'acme-corp',
    '{"query": "SELECT customer_id, transaction_date, amount FROM transactions WHERE date > ''2026-01-01''", "aggregation_only": true}'::jsonb,
    'ghi789jkl012mno345pqr678stu901vwx234yz567abc890',
    'Q1 2026 customer behavior analysis for executive report',
    'analytics-q1-report-2026',
    TRUE,
    'Action allowed via elevation grant: grant-2026-001',
    'grant-2026-001',
    TRUE,
    '{"records_accessed": 847, "aggregation_performed": true, "pii_redacted": true}'::jsonb,
    ARRAY['two_person_review', 'heightened_logging', 'data_minimization'],
    '{"ip_address": "10.0.1.46", "user_agent": "CIAF-Agent/1.3.2", "elevated": true}'::jsonb,
    NOW() - INTERVAL '45 minutes'
);

-- Successful model deployment
INSERT INTO agent_actions (
    action_id, principal_id, principal_type, action, resource_id, resource_type, 
    resource_tenant, params, params_hash, justification, correlation_id, 
    decision, reason, elevation_grant_id, executed, result, execution_duration_ms,
    policy_obligations, metadata, timestamp
)
VALUES (
    'action-2026-004',
    'agent-ml-deploy-003',
    'agent',
    'deploy_model',
    'model-fraud-detection-v2.3.1',
    'model',
    'acme-corp',
    '{"model_name": "fraud-detection", "version": "2.3.1", "environment": "production", "replicas": 3}'::jsonb,
    'jkl012mno345pqr678stu901vwx234yz567abc890def123',
    'Deploy critical security patch for fraud detection model',
    'deployment-fraud-v2.3.1',
    TRUE,
    'Agent has required role for action ''deploy_model''',
    NULL,
    TRUE,
    '{"deployment_status": "success", "endpoint": "https://ml.acme-corp.com/fraud-detection/v2.3.1", "health_check": "passed"}'::jsonb,
    45230,
    ARRAY['require_audit', 'performance_monitoring'],
    '{"ip_address": "10.0.1.47", "user_agent": "CIAF-Agent/1.3.2", "deployment_pipeline": "jenkins-prod-001"}'::jsonb,
    NOW() - INTERVAL '30 minutes'
);

-- Denied action - agent suspended
INSERT INTO agent_actions (
    action_id, principal_id, principal_type, action, resource_id, resource_type, 
    resource_tenant, params, params_hash, justification, correlation_id, 
    decision, reason, elevation_grant_id, executed, 
    policy_obligations, metadata, timestamp
)
VALUES (
    'action-2026-005',
    'agent-suspended-004',
    'agent',
    'read',
    'document-123',
    'document',
    'test-corp',
    '{"document_id": "123"}'::jsonb,
    'mno345pqr678stu901vwx234yz567abc890def123ghi456',
    'Read document for testing',
    'test-workflow-001',
    FALSE,
    'Agent status is ''suspended''',
    NULL,
    FALSE,
    ARRAY['security_alert'],
    '{"ip_address": "10.0.2.99", "user_agent": "CIAF-Agent/1.3.2", "security_flag": true}'::jsonb,
    NOW() - INTERVAL '15 minutes'
);

-- Human-initiated action (for comparison)
INSERT INTO agent_actions (
    action_id, principal_id, principal_type, action, resource_id, resource_type, 
    resource_tenant, params, params_hash, justification, correlation_id, 
    decision, reason, elevation_grant_id, executed, result, 
    policy_obligations, metadata, timestamp
)
VALUES (
    'action-2026-006',
    'human-alice-001',
    'human',
    'approve_payment',
    'payment-78901',
    'payment',
    'acme-corp',
    '{"amount": 250000, "currency": "USD", "recipient": "contractor-abc", "invoice": "INV-2026-002"}'::jsonb,
    'pqr678stu901vwx234yz567abc890def123ghi456jkl789',
    'Large payment requires CFO approval per policy',
    'workflow-payment-large-001',
    TRUE,
    'Agent has required role for action ''approve_payment''',
    NULL,
    TRUE,
    '{"status": "approved", "approval_code": "APV-2026-002", "processed_at": "2026-03-29T11:45:00Z", "human_verified": true}'::jsonb,
    ARRAY['require_audit', 'financial_reporting', 'executive_notification'],
    '{"ip_address": "10.0.1.10", "user_agent": "Mozilla/5.0", "session_id": "sess-alice-12345"}'::jsonb,
    NOW() - INTERVAL '10 minutes'
);

-- =====================================================
-- 4. AGENT RECEIPTS
-- =====================================================

-- Receipt for payment approval (action-2026-001)
INSERT INTO agent_receipts (
    receipt_id, action_id, timestamp, principal_id, principal_type, 
    action, resource_id, resource_type, correlation_id, 
    decision, reason, elevation_grant_id, approved_by, 
    params_hash, prior_receipt_hash, receipt_hash, signature, signature_algorithm,
    policy_obligations, metadata, chain_sequence
)
VALUES (
    'receipt-agent-001',
    'action-2026-001',
    NOW() - INTERVAL '2 hours',
    'agent-payment-001',
    'agent',
    'approve_payment',
    'payment-12345',
    'payment',
    'workflow-payment-batch-001',
    TRUE,
    'Agent has required role for action ''approve_payment''',
    NULL,
    NULL,
    'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    '0000000000000000000000000000000000000000000000000000000000000000',
    '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3',
    'sig_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3',
    'hmac-sha256',
    ARRAY['require_audit', 'financial_reporting'],
    '{"blockchain_anchor": "eth:0x123...abc", "timestamp_server": "timestamp.acme-corp.com"}'::jsonb,
    1
);

-- Receipt for elevated action (action-2026-003)
INSERT INTO agent_receipts (
    receipt_id, action_id, timestamp, principal_id, principal_type, 
    action, resource_id, resource_type, correlation_id, 
    decision, reason, elevation_grant_id, approved_by, 
    params_hash, prior_receipt_hash, receipt_hash, signature, signature_algorithm,
    policy_obligations, metadata, chain_sequence
)
VALUES (
    'receipt-agent-002',
    'action-2026-003',
    NOW() - INTERVAL '45 minutes',
    'agent-analytics-002',
    'agent',
    'access_pii',
    'customer-analysis-q1-2026',
    'customer_record',
    'analytics-q1-report-2026',
    TRUE,
    'Action allowed via elevation grant: grant-2026-001',
    'grant-2026-001',
    'human-alice-001',
    'ghi789jkl012mno345pqr678stu901vwx234yz567abc890',
    '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3',
    '2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4',
    'sig_2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4',
    'hmac-sha256',
    ARRAY['two_person_review', 'heightened_logging', 'data_minimization'],
    '{"blockchain_anchor": "eth:0x456...def", "timestamp_server": "timestamp.acme-corp.com", "elevated_access": true}'::jsonb,
    2
);

-- Receipt for model deployment (action-2026-004)
INSERT INTO agent_receipts (
    receipt_id, action_id, timestamp, principal_id, principal_type, 
    action, resource_id, resource_type, correlation_id, 
    decision, reason, elevation_grant_id, approved_by, 
    params_hash, prior_receipt_hash, receipt_hash, signature, signature_algorithm,
    policy_obligations, metadata, chain_sequence
)
VALUES (
    'receipt-agent-003',
    'action-2026-004',
    NOW() - INTERVAL '30 minutes',
    'agent-ml-deploy-003',
    'agent',
    'deploy_model',
    'model-fraud-detection-v2.3.1',
    'model',
    'deployment-fraud-v2.3.1',
    TRUE,
    'Agent has required role for action ''deploy_model''',
    NULL,
    NULL,
    'jkl012mno345pqr678stu901vwx234yz567abc890def123',
    '2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4',
    '3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5',
    'sig_3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5',
    'hmac-sha256',
    ARRAY['require_audit', 'performance_monitoring'],
    '{"blockchain_anchor": "eth:0x789...ghi", "timestamp_server": "timestamp.acme-corp.com", "deployment_verified": true}'::jsonb,
    3
);

-- Receipt for human action (action-2026-006)
INSERT INTO agent_receipts (
    receipt_id, action_id, timestamp, principal_id, principal_type, 
    action, resource_id, resource_type, correlation_id, 
    decision, reason, elevation_grant_id, approved_by, 
    params_hash, prior_receipt_hash, receipt_hash, signature, signature_algorithm,
    policy_obligations, metadata, chain_sequence
)
VALUES (
    'receipt-agent-004',
    'action-2026-006',
    NOW() - INTERVAL '10 minutes',
    'human-alice-001',
    'human',
    'approve_payment',
    'payment-78901',
    'payment',
    'workflow-payment-large-001',
    TRUE,
    'Agent has required role for action ''approve_payment''',
    NULL,
    NULL,
    'pqr678stu901vwx234yz567abc890def123ghi456jkl789',
    '3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5',
    '4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6',
    'sig_4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6',
    'hmac-sha256',
    ARRAY['require_audit', 'financial_reporting', 'executive_notification'],
    '{"blockchain_anchor": "eth:0xabc...jkl", "timestamp_server": "timestamp.acme-corp.com", "human_verified": true}'::jsonb,
    4
);

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- Verify agent identities
-- SELECT principal_id, display_name, principal_type, status, array_length(roles, 1) as role_count
-- FROM agent_identities
-- ORDER BY created_at;

-- Verify actions and decisions
-- SELECT action_id, principal_id, action, decision, reason, timestamp
-- FROM agent_actions
-- ORDER BY timestamp DESC;

-- Verify elevation grants
-- SELECT grant_id, principal_id, elevated_role, status, 
--        valid_from, valid_until, used_count, max_uses
-- FROM elevation_grants
-- ORDER BY granted_at DESC;

-- Verify receipt chain
-- SELECT receipt_id, action_id, principal_id, chain_sequence, 
--        LEFT(prior_receipt_hash, 16) as prev_hash,
--        LEFT(receipt_hash, 16) as curr_hash
-- FROM agent_receipts
-- ORDER BY chain_sequence;

-- Verify active agents summary view
-- SELECT * FROM active_agents_summary;

-- Verify recent violations view
-- SELECT * FROM recent_violations;

-- Verify active elevations view
-- SELECT * FROM active_elevations;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Record migration
COMMENT ON TABLE agent_identities IS 'Sample data added: 6 agent identities (agents, services, humans) with varied roles and statuses';
COMMENT ON TABLE agent_actions IS 'Sample data added: 6 actions demonstrating allowed, denied, elevated, and suspended scenarios';
COMMENT ON TABLE elevation_grants IS 'Sample data added: 3 grants (active, expiring, expired) with different scopes';
COMMENT ON TABLE agent_receipts IS 'Sample data added: 4 receipts forming a cryptographic chain with hash linkage';
