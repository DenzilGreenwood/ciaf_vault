// CIAF Event Types
// Based on pyciaf schema definitions

export interface BaseCIAFEvent {
  event_id: string
  timestamp: string
  metadata: Record<string, any>
}

// Core AI Model Lifecycle Events
export interface CoreEvent extends BaseCIAFEvent {
  model_name: string
  model_version?: string
  event_type: 'training' | 'inference' | 'deployment' | 'monitoring'
  stage: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
  lcm_stage?: string
  parent_event_id?: string
  receipt_id?: string
  merkle_root?: string
  content_hash?: string
  training_snapshot_id?: string
  org_id?: string
  user_id?: string
}

// Web AI Governance Events
export interface WebEvent extends BaseCIAFEvent {
  org_id: string
  user_id: string
  session_id?: string
  tool_name: string
  tool_category?: string
  tool_url?: string
  event_type: 'tool_detected' | 'content_submitted' | 'policy_violation' | 'blocked'
  policy_decision: 'allow' | 'warn' | 'block'
  policy_rule_id?: string
  sensitivity_score?: number
  is_shadow_ai: boolean
  detection_method?: string
  content_hash?: string
  content_summary?: string
  pii_detected: boolean
  pii_types?: string[]
  receipt_id?: string
}

// Cryptographic Receipt
export interface Receipt {
  id: string
  receipt_id: string
  timestamp: string
  event_id: string
  event_type: 'core' | 'web'
  content_hash: string
  merkle_root: string
  merkle_proof?: any
  previous_receipt_id?: string
  chain_sequence?: number
  signature?: string
  signature_algorithm: string
  metadata: Record<string, any>
}

// Compliance Event
export interface ComplianceEvent {
  id: string
  event_id: string
  timestamp: string
  framework: string
  control_id: string
  control_description?: string
  status: 'compliant' | 'violation' | 'warning' | 'pending'
  severity?: 'critical' | 'high' | 'medium' | 'low'
  source_event_id?: string
  source_event_type?: 'core' | 'web'
  finding?: string
  remediation_required: boolean
  remediation_steps?: string
  risk_level?: string
  risk_score?: number
  metadata: Record<string, any>
  resolved_at?: string
  resolved_by?: string
}

// Training Snapshot
export interface TrainingSnapshot {
  id: string
  snapshot_id: string
  timestamp: string
  model_name: string
  model_version?: string
  epoch?: number
  step?: number
  metrics: Record<string, any>
  dataset_hash?: string
  dataset_name?: string
  dataset_version?: string
  hyperparameters: Record<string, any>
  checkpoint_path?: string
  artifact_hash?: string
  event_id?: string
}

// Audit Trail
export interface AuditTrail {
  id: string
  timestamp: string
  action: string
  resource_type: string
  resource_id: string
  actor_id: string
  actor_type: 'user' | 'system' | 'api'
  ip_address?: string
  user_agent?: string
  old_value?: any
  new_value?: any
  metadata: Record<string, any>
}

// Dashboard Statistics
export interface DashboardStats {
  total_events: number
  events_today: number
  shadow_ai_detections_7d: number
  blocked_actions: number
  active_models: number
  compliance_violations: number
}

// Event Filters
export interface EventFilters {
  start_date?: string
  end_date?: string
  event_type?: string
  org_id?: string
  user_id?: string
  model_name?: string
  tool_name?: string
  policy_decision?: string
  is_shadow_ai?: boolean
  stage?: string
}

// API Response
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Event Ingestion Payload
export interface IngestEventPayload {
  event_type: 'core' | 'web'
  event_data: Partial<CoreEvent> | Partial<WebEvent>
  generate_receipt?: boolean
  enforce_policy?: boolean // Default: true for web events
}

// ===================================================
// Agent Tracking Types (Agentic Execution Boundaries)
// ===================================================

export type PrincipalType = 'agent' | 'service' | 'human' | 'system'
export type AgentStatus = 'active' | 'suspended' | 'revoked'
export type GrantStatus = 'active' | 'expired' | 'revoked'

// Agent Identity
export interface AgentIdentity {
  id: string
  principal_id: string
  principal_type: PrincipalType
  display_name: string
  roles: string[]
  attributes: Record<string, any> // tenant_id, environment, department, etc.
  status: AgentStatus
  fingerprint?: string
  created_at: string
  updated_at: string
  created_by?: string
  suspended_at?: string
  suspended_by?: string
  suspension_reason?: string
}

// Resource Definition
export interface Resource {
  resource_id: string
  resource_type: string
  resource_tenant?: string
}

// Agent Action
export interface AgentAction {
  id: string
  action_id: string
  principal_id: string
  principal_type: PrincipalType
  action: string
  resource_id: string
  resource_type: string
  resource_tenant?: string
  params: Record<string, any>
  params_hash?: string
  justification?: string
  correlation_id?: string
  decision: boolean // true=allowed, false=denied
  reason: string
  elevation_grant_id?: string
  executed: boolean
  result?: any
  error?: string
  execution_duration_ms?: number
  policy_obligations?: string[]
  receipt_id?: string
  metadata: Record<string, any>
  timestamp: string
  created_at: string
}

// Elevation Grant (PAM)
export interface ElevationGrant {
  id: string
  grant_id: string
  principal_id: string
  elevated_role: string
  scope: Record<string, any> // {actions: [], resource_types: [], max_amount: 100000}
  approved_by: string
  approval_ticket?: string
  purpose: string
  justification?: string
  granted_at: string
  valid_from: string
  valid_until: string
  used_count: number
  max_uses?: number
  last_used_at?: string
  status: GrantStatus
  revoked_at?: string
  revoked_by?: string
  revocation_reason?: string
  metadata: Record<string, any>
  created_at: string
}

// Agent Receipt (Cryptographic Evidence)
export interface AgentReceipt {
  id: string
  receipt_id: string
  action_id: string
  timestamp: string
  principal_id: string
  principal_type: PrincipalType
  action: string
  resource_id: string
  resource_type: string
  correlation_id?: string
  decision: boolean
  reason: string
  elevation_grant_id?: string
  approved_by?: string
  params_hash: string
  prior_receipt_hash: string
  receipt_hash: string
  signature: string
  signature_algorithm: string
  policy_obligations?: string[]
  metadata: Record<string, any>
  chain_sequence?: number
  created_at: string
}

// Agent Registration Payload
export interface RegisterAgentPayload {
  principal_id: string
  principal_type: PrincipalType
  display_name: string
  roles: string[]
  attributes?: Record<string, any>
  created_by?: string
}

// Action Execution Request
export interface ExecuteActionRequest {
  principal_id: string
  action: string
  resource: Resource
  params?: Record<string, any>
  justification?: string
  correlation_id?: string
  elevation_grant_id?: string
}

// Action Execution Response
export interface ExecuteActionResponse {
  allowed: boolean
  reason: string
  action_id: string
  receipt?: AgentReceipt
  policy_obligations?: string[]
  elevation_required?: boolean
  available_roles?: string[]
}

// Grant Creation Request
export interface GrantElevationRequest {
  principal_id: string
  elevated_role: string
  scope: Record<string, any>
  approved_by: string
  approval_ticket?: string
  purpose: string
  justification?: string
  valid_from?: string
  valid_until: string
  max_uses?: number
}

// Agent Summary Statistics
export interface AgentSummary {
  principal_id: string
  display_name: string
  principal_type: PrincipalType
  roles: string[]
  status: AgentStatus
  tenant_id?: string
  total_actions: number
  actions_allowed: number
  actions_denied: number
  last_action_at?: string
  active_grants: number
}

// Violation Summary
export interface AgentViolation {
  action_id: string
  principal_id: string
  display_name: string
  action: string
  resource_type: string
  resource_id: string
  reason: string
  timestamp: string
  correlation_id?: string
}
