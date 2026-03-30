export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events_core: {
        Row: {
          id: string
          event_id: string
          timestamp: string
          model_name: string
          model_version: string | null
          event_type: string
          stage: string
          lcm_stage: string | null
          metadata: Json
          parent_event_id: string | null
          receipt_id: string | null
          merkle_root: string | null
          content_hash: string | null
          training_snapshot_id: string | null
          created_at: string
          updated_at: string
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          event_id: string
          model_name: string
          event_type: string
          stage: string
          metadata?: Json
          timestamp?: string
          model_version?: string | null
          lcm_stage?: string | null
          parent_event_id?: string | null
          receipt_id?: string | null
          merkle_root?: string | null
          content_hash?: string | null
          training_snapshot_id?: string | null
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string
          model_name?: string
          event_type?: string
          stage?: string
          metadata?: Json
          timestamp?: string
          model_version?: string | null
          lcm_stage?: string | null
          parent_event_id?: string | null
          receipt_id?: string | null
          merkle_root?: string | null
          content_hash?: string | null
          training_snapshot_id?: string | null
          org_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events_web: {
        Row: {
          id: string
          event_id: string
          timestamp: string
          org_id: string
          user_id: string
          session_id: string | null
          tool_name: string
          tool_category: string | null
          tool_url: string | null
          event_type: string
          policy_decision: string
          policy_rule_id: string | null
          sensitivity_score: number | null
          is_shadow_ai: boolean
          detection_method: string | null
          content_hash: string | null
          content_summary: string | null
          pii_detected: boolean
          pii_types: string[] | null
          metadata: Json
          receipt_id: string | null
          created_at: string
        }
        Insert: {
          event_id: string
          org_id: string
          user_id: string
          tool_name: string
          event_type: string
          policy_decision: string
          metadata?: Json
          timestamp?: string
          session_id?: string | null
          tool_category?: string | null
          tool_url?: string | null
          policy_rule_id?: string | null
          sensitivity_score?: number | null
          is_shadow_ai?: boolean
          detection_method?: string | null
          content_hash?: string | null
          content_summary?: string | null
          pii_detected?: boolean
          pii_types?: string[] | null
          receipt_id?: string | null
        }
        Update: {
          event_id?: string
          org_id?: string
          user_id?: string
          tool_name?: string
          event_type?: string
          policy_decision?: string
          metadata?: Json
          timestamp?: string
          session_id?: string | null
          tool_category?: string | null
          tool_url?: string | null
          policy_rule_id?: string | null
          sensitivity_score?: number | null
          is_shadow_ai?: boolean
          detection_method?: string | null
          content_hash?: string | null
          content_summary?: string | null
          pii_detected?: boolean
          pii_types?: string[] | null
          receipt_id?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          receipt_id: string
          timestamp: string
          event_id: string
          event_type: string
          content_hash: string
          merkle_root: string
          merkle_proof: Json | null
          previous_receipt_id: string | null
          chain_sequence: number | null
          signature: string | null
          signature_algorithm: string
          metadata: Json
          created_at: string
        }
        Insert: {
          receipt_id: string
          event_id: string
          event_type: string
          content_hash: string
          merkle_root: string
          signature_algorithm?: string
          metadata?: Json
          timestamp?: string
          merkle_proof?: Json | null
          previous_receipt_id?: string | null
          chain_sequence?: number | null
          signature?: string | null
        }
        Update: {
          receipt_id?: string
          event_id?: string
          event_type?: string
          content_hash?: string
          merkle_root?: string
          signature_algorithm?: string
          metadata?: Json
          timestamp?: string
          merkle_proof?: Json | null
          previous_receipt_id?: string | null
          chain_sequence?: number | null
          signature?: string | null
        }
        Relationships: []
      }
      compliance_events: {
        Row: {
          id: string
          event_id: string
          timestamp: string
          framework: string
          control_id: string
          control_description: string | null
          status: string
          severity: string | null
          source_event_id: string | null
          source_event_type: string | null
          finding: string | null
          remediation_required: boolean
          remediation_steps: string | null
          risk_level: string | null
          risk_score: number | null
          metadata: Json
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          event_id: string
          framework: string
          control_id: string
          status: string
          metadata?: Json
          timestamp?: string
          control_description?: string | null
          severity?: string | null
          source_event_id?: string | null
          source_event_type?: string | null
          finding?: string | null
          remediation_required?: boolean
          remediation_steps?: string | null
          risk_level?: string | null
          risk_score?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          event_id?: string
          framework?: string
          control_id?: string
          status?: string
          metadata?: Json
          timestamp?: string
          control_description?: string | null
          severity?: string | null
          source_event_id?: string | null
          source_event_type?: string | null
          finding?: string | null
          remediation_required?: boolean
          remediation_steps?: string | null
          risk_level?: string | null
          risk_score?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      training_snapshots: {
        Row: {
          id: string
          snapshot_id: string
          timestamp: string
          model_name: string
          model_version: string | null
          epoch: number | null
          step: number | null
          metrics: Json
          dataset_hash: string | null
          dataset_name: string | null
          dataset_version: string | null
          hyperparameters: Json
          checkpoint_path: string | null
          artifact_hash: string | null
          event_id: string | null
          created_at: string
        }
        Insert: {
          snapshot_id: string
          model_name: string
          metrics?: Json
          hyperparameters?: Json
          timestamp?: string
          model_version?: string | null
          epoch?: number | null
          step?: number | null
          dataset_hash?: string | null
          dataset_name?: string | null
          dataset_version?: string | null
          checkpoint_path?: string | null
          artifact_hash?: string | null
          event_id?: string | null
        }
        Update: {
          snapshot_id?: string
          model_name?: string
          metrics?: Json
          hyperparameters?: Json
          timestamp?: string
          model_version?: string | null
          epoch?: number | null
          step?: number | null
          dataset_hash?: string | null
          dataset_name?: string | null
          dataset_version?: string | null
          checkpoint_path?: string | null
          artifact_hash?: string | null
          event_id?: string | null
        }
        Relationships: []
      }
      audit_trails: {
        Row: {
          id: string
          timestamp: string
          action: string
          resource_type: string
          resource_id: string
          actor_id: string
          actor_type: string
          ip_address: string | null
          user_agent: string | null
          old_value: Json | null
          new_value: Json | null
          metadata: Json
          created_at: string
        }
        Insert: {
          action: string
          resource_type: string
          resource_id: string
          actor_id: string
          actor_type: string
          metadata?: Json
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          old_value?: Json | null
          new_value?: Json | null
        }
        Update: {
          action?: string
          resource_type?: string
          resource_id?: string
          actor_id?: string
          actor_type?: string
          metadata?: Json
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          old_value?: Json | null
          new_value?: Json | null
        }
        Relationships: []
      }
      agent_identities: {
        Row: {
          id: string
          principal_id: string
          principal_type: string
          display_name: string
          roles: string[]
          attributes: Json
          status: string
          fingerprint: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
        }
        Insert: {
          principal_id: string
          principal_type: string
          display_name: string
          roles?: string[]
          attributes?: Json
          status?: string
          fingerprint?: string | null
          created_by?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
        }
        Update: {
          principal_id?: string
          principal_type?: string
          display_name?: string
          roles?: string[]
          attributes?: Json
          status?: string
          fingerprint?: string | null
          created_by?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          id: string
          action_id: string
          principal_id: string
          principal_type: string
          action: string
          resource_id: string
          resource_type: string
          resource_tenant: string | null
          params: Json
          params_hash: string | null
          justification: string | null
          correlation_id: string | null
          decision: boolean
          reason: string
          elevation_grant_id: string | null
          executed: boolean
          result: Json | null
          error: string | null
          execution_duration_ms: number | null
          policy_obligations: string[]
          receipt_id: string | null
          metadata: Json
          timestamp: string
          created_at: string
        }
        Insert: {
          action_id: string
          principal_id: string
          principal_type: string
          action: string
          resource_id: string
          resource_type: string
          resource_tenant?: string | null
          params?: Json
          params_hash?: string | null
          justification?: string | null
          correlation_id?: string | null
          decision: boolean
          reason: string
          elevation_grant_id?: string | null
          executed?: boolean
          result?: Json | null
          error?: string | null
          execution_duration_ms?: number | null
          policy_obligations?: string[]
          receipt_id?: string | null
          metadata?: Json
          timestamp?: string
        }
        Update: {
          action_id?: string
          principal_id?: string
          principal_type?: string
          action?: string
          resource_id?: string
          resource_type?: string
          resource_tenant?: string | null
          params?: Json
          params_hash?: string | null
          justification?: string | null
          correlation_id?: string | null
          decision?: boolean
          reason?: string
          elevation_grant_id?: string | null
          executed?: boolean
          result?: Json | null
          error?: string | null
          execution_duration_ms?: number | null
          policy_obligations?: string[]
          receipt_id?: string | null
          metadata?: Json
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_agent_identity"
            columns: ["principal_id"]
            referencedRelation: "agent_identities"
            referencedColumns: ["principal_id"]
          }
        ]
      }
      elevation_grants: {
        Row: {
          id: string
          grant_id: string
          principal_id: string
          elevated_role: string
          scope: Json
          approved_by: string
          approval_ticket: string | null
          purpose: string
          justification: string | null
          granted_at: string
          valid_from: string
          valid_until: string
          used_count: number
          max_uses: number | null
          last_used_at: string | null
          status: string
          revoked_at: string | null
          revoked_by: string | null
          revocation_reason: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          grant_id: string
          principal_id: string
          elevated_role: string
          scope?: Json
          approved_by: string
          approval_ticket?: string | null
          purpose: string
          justification?: string | null
          granted_at?: string
          valid_from?: string
          valid_until: string
          used_count?: number
          max_uses?: number | null
          last_used_at?: string | null
          status?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revocation_reason?: string | null
          metadata?: Json
        }
        Update: {
          grant_id?: string
          principal_id?: string
          elevated_role?: string
          scope?: Json
          approved_by?: string
          approval_ticket?: string | null
          purpose?: string
          justification?: string | null
          granted_at?: string
          valid_from?: string
          valid_until?: string
          used_count?: number
          max_uses?: number | null
          last_used_at?: string | null
          status?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revocation_reason?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_grant_principal"
            columns: ["principal_id"]
            referencedRelation: "agent_identities"
            referencedColumns: ["principal_id"]
          }
        ]
      }
      agent_receipts: {
        Row: {
          id: string
          receipt_id: string
          action_id: string
          timestamp: string
          principal_id: string
          principal_type: string
          action: string
          resource_id: string
          resource_type: string
          correlation_id: string | null
          decision: boolean
          reason: string
          elevation_grant_id: string | null
          approved_by: string | null
          params_hash: string
          prior_receipt_hash: string
          receipt_hash: string
          signature: string
          signature_algorithm: string
          policy_obligations: string[]
          metadata: Json
          chain_sequence: number | null
          created_at: string
        }
        Insert: {
          receipt_id: string
          action_id: string
          timestamp?: string
          principal_id: string
          principal_type: string
          action: string
          resource_id: string
          resource_type: string
          correlation_id?: string | null
          decision: boolean
          reason: string
          elevation_grant_id?: string | null
          approved_by?: string | null
          params_hash: string
          prior_receipt_hash?: string
          receipt_hash: string
          signature: string
          signature_algorithm?: string
          policy_obligations?: string[]
          metadata?: Json
          chain_sequence?: number | null
        }
        Update: {
          receipt_id?: string
          action_id?: string
          timestamp?: string
          principal_id?: string
          principal_type?: string
          action?: string
          resource_id?: string
          resource_type?: string
          correlation_id?: string | null
          decision?: boolean
          reason?: string
          elevation_grant_id?: string | null
          approved_by?: string | null
          params_hash?: string
          prior_receipt_hash?: string
          receipt_hash?: string
          signature?: string
          signature_algorithm?: string
          policy_obligations?: string[]
          metadata?: Json
          chain_sequence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_receipt_action"
            columns: ["action_id"]
            referencedRelation: "agent_actions"
            referencedColumns: ["action_id"]
          },
          {
            foreignKeyName: "fk_receipt_principal"
            columns: ["principal_id"]
            referencedRelation: "agent_identities"
            referencedColumns: ["principal_id"]
          }
        ]
      }
    }
    Views: {
      active_agents_summary: {
        Row: {
          principal_id: string | null
          display_name: string | null
          principal_type: string | null
          roles: string[] | null
          status: string | null
          tenant_id: string | null
          total_actions: number | null
          actions_allowed: number | null
          actions_denied: number | null
          last_action_at: string | null
          active_grants: number | null
        }
      }
      recent_violations: {
        Row: {
          action_id: string | null
          principal_id: string | null
          display_name: string | null
          action: string | null
          resource_type: string | null
          resource_id: string | null
          reason: string | null
          timestamp: string | null
          correlation_id: string | null
        }
      }
      active_elevations: {
        Row: {
          grant_id: string | null
          principal_id: string | null
          display_name: string | null
          elevated_role: string | null
          scope: Json | null
          approved_by: string | null
          purpose: string | null
          valid_from: string | null
          valid_until: string | null
          used_count: number | null
          max_uses: number | null
          approval_ticket: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
