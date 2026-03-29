/**
 * Policy Enforcement Engine
 * 
 * Evaluates events against policy rules and returns enforcement decisions
 */

import { PIIDetector, type PIIDetectionResult } from '../detection/PIIDetector'
import { ShadowAIDetector, type ShadowAIResult } from '../detection/ShadowAIDetector'

export type PolicyDecision = 'ALLOW' | 'WARN' | 'BLOCK'

export interface PolicyRule {
  id: string
  name: string
  description: string
  enabled: boolean
  priority: number // Higher priority rules evaluated first
  conditions: PolicyCondition[]
  action: PolicyDecision
  message: string
}

export interface PolicyCondition {
  type: 'shadow_ai' | 'pii_detected' | 'sensitivity_score' | 'tool_category' | 'content_keywords'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface PolicyEvaluationContext {
  toolName: string
  toolUrl?: string
  content?: string
  userRole?: string
  orgId: string
  userId: string
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision
  matchedRules: PolicyRule[]
  shadowAI: ShadowAIResult | null
  pii: PIIDetectionResult | null
  reason: string
  redactedContent?: string
  metadata: {
    evaluatedAt: string
    rulesEvaluated: number
    processingTimeMs: number
  }
}

export class PolicyEngine {
  private rules: PolicyRule[]

  constructor(rules?: PolicyRule[]) {
    this.rules = rules || this.getDefaultRules()
  }

  /**
   * Evaluate event against all policy rules
   */
  evaluate(context: PolicyEvaluationContext): PolicyEvaluationResult {
    const startTime = Date.now()
    const matchedRules: PolicyRule[] = []

    // Detect shadow AI
    const shadowAI = ShadowAIDetector.detect(context.toolName, context.toolUrl)

    // Detect PII if content provided
    const pii = context.content ? PIIDetector.detect(context.content) : null

    // Evaluate rules in priority order
    const sortedRules = [...this.rules]
      .filter((r) => r.enabled)
      .sort((a, b) => b.priority - a.priority)

    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, context, shadowAI, pii)) {
        matchedRules.push(rule)
      }
    }

    // Determine final decision (most restrictive wins)
    let decision: PolicyDecision = 'ALLOW'
    let reason = 'No policy violations detected'

    if (matchedRules.length > 0) {
      // Priority: BLOCK > WARN > ALLOW
      const blockRule = matchedRules.find((r) => r.action === 'BLOCK')
      const warnRule = matchedRules.find((r) => r.action === 'WARN')

      if (blockRule) {
        decision = 'BLOCK'
        reason = blockRule.message
      } else if (warnRule) {
        decision = 'WARN'
        reason = warnRule.message
      }
    }

    // Redact content if PII detected
    const redactedContent =
      pii && pii.detected && context.content
        ? PIIDetector.redactContent(context.content)
        : undefined

    return {
      decision,
      matchedRules,
      shadowAI,
      pii,
      reason,
      redactedContent,
      metadata: {
        evaluatedAt: new Date().toISOString(),
        rulesEvaluated: sortedRules.length,
        processingTimeMs: Date.now() - startTime,
      },
    }
  }

  /**
   * Evaluate single rule against context
   */
  private evaluateRule(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
    shadowAI: ShadowAIResult,
    pii: PIIDetectionResult | null
  ): boolean {
    // All conditions must match (AND logic)
    return rule.conditions.every((condition) =>
      this.evaluateCondition(condition, context, shadowAI, pii)
    )
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: PolicyCondition,
    context: PolicyEvaluationContext,
    shadowAI: ShadowAIResult,
    pii: PIIDetectionResult | null
  ): boolean {
    switch (condition.type) {
      case 'shadow_ai':
        return this.evaluateOperator(
          shadowAI.isShadowAI,
          condition.operator,
          condition.value
        )

      case 'pii_detected':
        return this.evaluateOperator(
          pii?.detected || false,
          condition.operator,
          condition.value
        )

      case 'sensitivity_score':
        return this.evaluateOperator(
          pii?.sensitivityScore || 0,
          condition.operator,
          condition.value
        )

      case 'tool_category':
        return this.evaluateOperator(
          shadowAI.toolCategory,
          condition.operator,
          condition.value
        )

      case 'content_keywords':
        if (!context.content) return false
        const keywords = condition.value as string[]
        const contentLower = context.content.toLowerCase()
        return keywords.some((keyword) => contentLower.includes(keyword.toLowerCase()))

      default:
        return false
    }
  }

  /**
   * Evaluate operator
   */
  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected

      case 'contains':
        if (typeof actual === 'string') {
          return actual.toLowerCase().includes(expected.toLowerCase())
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected)
        }
        return false

      case 'greater_than':
        return Number(actual) > Number(expected)

      case 'less_than':
        return Number(actual) < Number(expected)

      default:
        return false
    }
  }

  /**
   * Add rule
   */
  addRule(rule: PolicyRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId)
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<PolicyRule>): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
      return true
    }
    return false
  }

  /**
   * Get all rules
   */
  getRules(): PolicyRule[] {
    return this.rules
  }

  /**
   * Default policy rules
   */
  private getDefaultRules(): PolicyRule[] {
    return [
      {
        id: 'block-shadow-ai-high-pii',
        name: 'Block Shadow AI with High PII',
        description: 'Block unapproved AI tools when highly sensitive PII is detected',
        enabled: true,
        priority: 100,
        conditions: [
          { type: 'shadow_ai', operator: 'equals', value: true },
          { type: 'sensitivity_score', operator: 'greater_than', value: 0.8 },
        ],
        action: 'BLOCK',
        message:
          'BLOCKED: Highly sensitive content detected in unapproved AI tool. Use approved enterprise tools.',
      },
      {
        id: 'warn-shadow-ai-medium-pii',
        name: 'Warn Shadow AI with Medium PII',
        description: 'Warn when moderate PII is submitted to unapproved tools',
        enabled: true,
        priority: 90,
        conditions: [
          { type: 'shadow_ai', operator: 'equals', value: true },
          { type: 'sensitivity_score', operator: 'greater_than', value: 0.5 },
        ],
        action: 'WARN',
        message:
          'WARNING: Sensitive content detected in unapproved AI tool. Consider using approved alternatives.',
      },
      {
        id: 'block-api-keys',
        name: 'Block API Keys in Any Tool',
        description: 'Block submission of API keys to any AI tool',
        enabled: true,
        priority: 110,
        conditions: [
          { type: 'content_keywords', operator: 'contains', value: ['API_KEY', 'AWS_KEY'] },
        ],
        action: 'BLOCK',
        message: 'BLOCKED: API keys or credentials detected. Never share secrets with AI tools.',
      },
      {
        id: 'block-image-generators',
        name: 'Block Image Generators',
        description: 'Block all image generation tools (copyright/DMCA risk)',
        enabled: true,
        priority: 95,
        conditions: [
          { type: 'tool_category', operator: 'equals', value: 'image_generator' },
        ],
        action: 'BLOCK',
        message:
          'BLOCKED: Image generation tools are not approved due to copyright concerns.',
      },
      {
        id: 'warn-shadow-ai-general',
        name: 'Warn Shadow AI (General)',
        description: 'Warn for any unapproved AI tool usage',
        enabled: true,
        priority: 50,
        conditions: [{ type: 'shadow_ai', operator: 'equals', value: true }],
        action: 'WARN',
        message:
          'WARNING: This AI tool is not approved. Please use approved enterprise tools for work-related content.',
      },
    ]
  }
}
