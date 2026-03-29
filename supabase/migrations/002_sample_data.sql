-- =====================================================
-- CIAF Vault - Sample Data for Development/Testing
-- © 2025 Denzil James Greenwood
-- =====================================================

-- Insert sample core events
INSERT INTO events_core (event_id, model_name, model_version, event_type, stage, lcm_stage, metadata, org_id, user_id, content_hash) VALUES
('evt_core_001', 'sentiment-analyzer-v2', '2.1.0', 'training', 'A', 'preparation', '{"dataset": "customer_reviews", "samples": 50000}', 'org_demo', 'user_alice', 'hash_001'),
('evt_core_002', 'sentiment-analyzer-v2', '2.1.0', 'training', 'B', 'training', '{"epoch": 10, "loss": 0.23, "accuracy": 0.94}', 'org_demo', 'user_alice', 'hash_002'),
('evt_core_003', 'fraud-detector', '1.0.0', 'inference', 'E', 'inference', '{"predictions": 1523, "flagged": 12}', 'org_demo', 'user_bob', 'hash_003'),
('evt_core_004', 'recommendation-engine', '3.2.1', 'deployment', 'D', 'deployment', '{"environment": "production", "replicas": 3}', 'org_demo', 'user_alice', 'hash_004');

-- Insert sample web events
INSERT INTO events_web (event_id, org_id, user_id, session_id, tool_name, tool_category, event_type, policy_decision, sensitivity_score, is_shadow_ai, metadata, content_hash) VALUES
('evt_web_001', 'org_demo', 'user_charlie', 'sess_001', 'ChatGPT', 'chatbot', 'tool_detected', 'warn', 0.65, TRUE, '{"url": "chat.openai.com", "browser": "Chrome"}', 'hash_web_001'),
('evt_web_002', 'org_demo', 'user_diana', 'sess_002', 'GitHub Copilot', 'code_generator', 'content_submitted', 'allow', 0.25, FALSE, '{"language": "python", "lines": 45}', 'hash_web_002'),
('evt_web_003', 'org_demo', 'user_charlie', 'sess_003', 'Midjourney', 'image_generator', 'tool_detected', 'block', 0.85, TRUE, '{"url": "midjourney.com", "prompt_detected": true}', 'hash_web_003'),
('evt_web_004', 'org_demo', 'user_eve', 'sess_004', 'Gemini', 'chatbot', 'policy_violation', 'block', 0.92, TRUE, '{"violation": "PII_detected", "pii_types": ["email", "phone"]}', 'hash_web_004');

-- Insert sample receipts
INSERT INTO receipts (receipt_id, event_id, event_type, content_hash, merkle_root, chain_sequence, signature_algorithm) VALUES
('rcpt_001', 'evt_core_001', 'core', 'hash_001', 'merkle_root_001', 1, 'ed25519'),
('rcpt_002', 'evt_core_002', 'core', 'hash_002', 'merkle_root_002', 2, 'ed25519'),
('rcpt_003', 'evt_web_001', 'web', 'hash_web_001', 'merkle_root_003', 3, 'ed25519'),
('rcpt_004', 'evt_web_002', 'web', 'hash_web_002', 'merkle_root_004', 4, 'ed25519');

-- Insert sample compliance events
INSERT INTO compliance_events (event_id, framework, control_id, control_description, status, severity, source_event_id, source_event_type, finding, risk_level) VALUES
('comp_001', 'GDPR', 'Art.32', 'Security of processing', 'compliant', 'low', 'evt_core_001', 'core', 'Encryption at rest verified', 'low'),
('comp_002', 'HIPAA', 'Safeguard-164.312', 'Technical safeguards', 'violation', 'high', 'evt_web_004', 'web', 'PII transmitted to unauthorized service', 'critical'),
('comp_003', 'SOC2', 'CC6.1', 'Logical access controls', 'compliant', 'low', 'evt_core_003', 'core', 'Access logs maintained', 'low');

-- Insert sample training snapshots
INSERT INTO training_snapshots (snapshot_id, model_name, model_version, epoch, step, metrics, hyperparameters, event_id) VALUES
('snap_001', 'sentiment-analyzer-v2', '2.1.0', 5, 1000, '{"loss": 0.45, "accuracy": 0.87, "val_loss": 0.48}', '{"lr": 0.001, "batch_size": 32}', 'evt_core_001'),
('snap_002', 'sentiment-analyzer-v2', '2.1.0', 10, 2000, '{"loss": 0.23, "accuracy": 0.94, "val_loss": 0.25}', '{"lr": 0.0005, "batch_size": 32}', 'evt_core_002');

-- Insert sample audit trails
INSERT INTO audit_trails (action, resource_type, resource_id, actor_id, actor_type, metadata) VALUES
('create', 'event', 'evt_core_001', 'user_alice', 'user', '{"source": "api", "method": "POST"}'),
('view', 'receipt', 'rcpt_001', 'user_bob', 'user', '{"source": "web_dashboard"}'),
('export', 'compliance', 'comp_002', 'user_admin', 'user', '{"format": "pdf", "destination": "email"}');

-- Refresh materialized views
REFRESH MATERIALIZED VIEW daily_event_stats;
REFRESH MATERIALIZED VIEW shadow_ai_summary;

COMMENT ON TABLE events_core IS 'Sample data inserted for development and testing';
