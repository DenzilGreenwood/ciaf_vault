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
}
