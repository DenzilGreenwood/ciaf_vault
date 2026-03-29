/**
 * Compliance Scoring Engine
 * 
 * Calculates compliance scores across regulatory frameworks
 */

export interface ComplianceFramework {
  id: string
  name: string
  description: string
  controls: ComplianceControl[]
}

export interface ComplianceControl {
  id: string
  name: string
  description: string
  category: string
  required: boolean
  weight: number // Importance weight (0-1)
  verification_method: string
}

export interface ComplianceScore {
  overall_score: number // 0-100
  frameworks: {
    [key: string]: FrameworkScore
  }
  gaps: ComplianceGap[]
  last_evaluated: string
}

export interface FrameworkScore {
  score: number // 0-100
  controls_met: number
  controls_total: number
  status: 'compliant' | 'partial' | 'non_compliant'
  details: ControlEval[]
}

export interface ControlEvaluation {
  control_id: string
  control_name: string
  met: boolean
  evidence: string[]
  gap_reason?: string
}

export interface ComplianceGap {
  framework: string
  control_id: string
  control_name: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  remediation: string
}

type ControlEval = ComplianceControl & { met: boolean; evidence: string[] }

export class ComplianceScorer {
  private frameworks: ComplianceFramework[]

  constructor() {
    this.frameworks = this.getStandardFrameworks()
  }

  /**
   * Calculate overall compliance score
   */
  calculate(
    events: any[],
    auditTrails: any[],
    receipts: any[]
  ): ComplianceScore {
    const frameworkScores: { [key: string]: FrameworkScore } = {}
    const gaps: ComplianceGap[] = []

    for (const framework of this.frameworks) {
      const score = this.evaluateFramework(framework, events, auditTrails, receipts)
      frameworkScores[framework.id] = score

      // Collect gaps
      for (const control of score.details) {
        if (!control.met && control.required) {
          gaps.push({
            framework: framework.name,
            control_id: control.id,
            control_name: control.name,
            description: control.description,
            severity: control.weight > 0.8 ? 'critical' : control.weight > 0.6 ? 'high' : 'medium',
            remediation: `Implement ${control.name}: ${control.verification_method}`,
          })
        }
      }
    }

    // Calculate overall score (weighted average across frameworks)
    const totalWeight = this.frameworks.length
    const totalScore = Object.values(frameworkScores).reduce(
      (sum, fs) => sum + fs.score,
      0
    )
    const overall_score = Math.round(totalScore / totalWeight)

    return {
      overall_score,
      frameworks: frameworkScores,
      gaps: gaps.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      }),
      last_evaluated: new Date().toISOString(),
    }
  }

  /**
   * Evaluate single framework
   */
  private evaluateFramework(
    framework: ComplianceFramework,
    events: any[],
    auditTrails: any[],
    receipts: any[]
  ): FrameworkScore {
    const details: ControlEval[] = []
    let totalWeightMet = 0
    let totalWeight = 0

    for (const control of framework.controls) {
      const met = this.evaluateControl(control, events, auditTrails, receipts)
      const evidence = this.collectEvidence(control, events, auditTrails, receipts)

      details.push({
        ...control,
        met,
        evidence,
      })

      if (met) {
        totalWeightMet += control.weight
      }
      totalWeight += control.weight
    }

    const controlsMet = details.filter((d) => d.met).length
    const controlsTotal = details.length
    const score = totalWeight > 0 ? Math.round((totalWeightMet / totalWeight) * 100) : 0

    const status: 'compliant' | 'partial' | 'non_compliant' =
      score >= 90 ? 'compliant' : score >= 50 ? 'partial' : 'non_compliant'

    return {
      score,
      controls_met: controlsMet,
      controls_total: controlsTotal,
      status,
      details,
    }
  }

  /**
   * Evaluate single control
   */
  private evaluateControl(
    control: ComplianceControl,
    events: any[],
    auditTrails: any[],
    receipts: any[]
  ): boolean {
    // Control-specific evaluation logic
    switch (control.id) {
      // EU AI Act
      case 'EU_AI_ACT_ART_10':
        // Article 10: Training data governance
        return events.some((e) => e.event_type === 'training' && e.metadata?.dataset_hash)

      case 'EU_AI_ACT_ART_17':
        // Article 17: Record-keeping
        return receipts.length > 0

      // GDPR
      case 'GDPR_ART_5_1_A':
        // Lawfulness, fairness, transparency
        return auditTrails.some((a) => a.action === 'consent_recorded')

      case 'GDPR_ART_25':
        // Data protection by design
        return events.some((e) => e.pii_detected === false || e.content_hash)

      case 'GDPR_ART_30':
        // Records of processing activities
        return auditTrails.length > 0

      case 'GDPR_ART_32':
        // Security of processing (encryption)
        return receipts.some((r) => r.signature && r.content_hash)

      // NIST AI RMF
      case 'NIST_GOVERN_1_1':
        // Policies and procedures
        return events.some((e) => e.policy_decision)

      case 'NIST_MAP_1_1':
        // AI system documentation
        return events.some((e) => e.model_name && e.model_version)

      case 'NIST_MEASURE_2_3':
        // Tracking and documentation
        return auditTrails.length >= 10

      case 'NIST_MANAGE_2_1':
        // Risk tracking
        return events.some((e) => e.sensitivity_score !== undefined)

      // HIPAA
      case 'HIPAA_164_308_A_1':
        // Security management process
        return auditTrails.some((a) => a.action.includes('security'))

      case 'HIPAA_164_312_A_1':
        // Access control
        return events.some((e) => e.user_id && e.org_id)

      case 'HIPAA_164_312_B':
        // Audit controls
        return auditTrails.length > 0

      case 'HIPAA_164_312_E_1':
        // Transmission security (integrity)
        return receipts.some((r) => r.content_hash)

      default:
        return false
    }
  }

  /**
   * Collect evidence for control
   */
  private collectEvidence(
    control: ComplianceControl,
    events: any[],
    auditTrails: any[],
    receipts: any[]
  ): string[] {
    const evidence: string[] = []

    switch (control.id) {
      case 'EU_AI_ACT_ART_10':
        const trainingEvents = events.filter((e) => e.event_type === 'training')
        evidence.push(`${trainingEvents.length} training events with data governance`)
        break

      case 'EU_AI_ACT_ART_17':
        evidence.push(`${receipts.length} cryptographic receipts generated`)
        break

      case 'GDPR_ART_32':
        const encryptedEvents = receipts.filter((r) => r.signature)
        evidence.push(`${encryptedEvents.length} events cryptographically signed`)
        break

      case 'NIST_MEASURE_2_3':
        evidence.push(`${auditTrails.length} audit trail entries`)
        break

      default:
        evidence.push('Automated evaluation')
    }

    return evidence
  }

  /**
   * Get standard compliance frameworks
   */
  private getStandardFrameworks(): ComplianceFramework[] {
    return [
      {
        id: 'EU_AI_ACT',
        name: 'EU AI Act',
        description: 'European Union Artificial Intelligence Act',
        controls: [
          {
            id: 'EU_AI_ACT_ART_10',
            name: 'Article 10: Data Governance',
            description: 'Training data must be governed with quality and bias controls',
            category: 'data_governance',
            required: true,
            weight: 0.9,
            verification_method: 'Training events with dataset hashes',
          },
          {
            id: 'EU_AI_ACT_ART_11',
            name: 'Article 11: Technical Documentation',
            description: 'Maintain comprehensive technical documentation',
            category: 'documentation',
            required: true,
            weight: 0.8,
            verification_method: 'Model metadata and snapshots',
          },
          {
            id: 'EU_AI_ACT_ART_12',
            name: 'Article 12: Record-keeping',
            description: 'Automatic recording of events',
            category: 'audit',
            required: true,
            weight: 0.9,
            verification_method: 'Audit trails and receipts',
          },
          {
            id: 'EU_AI_ACT_ART_17',
            name: 'Article 17: Quality Management System',
            description: 'Quality management processes for AI systems',
            category: 'quality',
            required: true,
            weight: 0.7,
            verification_method: 'Compliance events and monitoring',
          },
        ],
      },
      {
        id: 'GDPR',
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        controls: [
          {
            id: 'GDPR_ART_5_1_A',
            name: 'Article 5(1)(a): Lawfulness',
            description: 'Processing must be lawful, fair, and transparent',
            category: 'principles',
            required: true,
            weight: 1.0,
            verification_method: 'Consent records and legal basis',
          },
          {
            id: 'GDPR_ART_25',
            name: 'Article 25: Data Protection by Design',
            description: 'Privacy by design and by default',
            category: 'privacy',
            required: true,
            weight: 0.9,
            verification_method: 'PII detection and content hashing',
          },
          {
            id: 'GDPR_ART_30',
            name: 'Article 30: Records of Processing',
            description: 'Maintain records of processing activities',
            category: 'documentation',
            required: true,
            weight: 0.8,
            verification_method: 'Audit trails',
          },
          {
            id: 'GDPR_ART_32',
            name: 'Article 32: Security',
            description: 'Appropriate security measures including encryption',
            category: 'security',
            required: true,
            weight: 1.0,
            verification_method: 'Cryptographic receipts and hashing',
          },
        ],
      },
      {
        id: 'NIST_AI_RMF',
        name: 'NIST AI RMF',
        description: 'NIST AI Risk Management Framework',
        controls: [
          {
            id: 'NIST_GOVERN_1_1',
            name: 'GOVERN-1.1: Policies',
            description: 'AI governance policies exist',
            category: 'governance',
            required: true,
            weight: 0.8,
            verification_method: 'Policy enforcement evidence',
          },
          {
            id: 'NIST_MAP_1_1',
            name: 'MAP-1.1: System Documentation',
            description: 'AI system is documented',
            category: 'documentation',
            required: true,
            weight: 0.7,
            verification_method: 'Model metadata',
          },
          {
            id: 'NIST_MEASURE_2_3',
            name: 'MEASURE-2.3: Tracking',
            description: 'AI system performance is tracked',
            category: 'monitoring',
            required: true,
            weight: 0.9,
            verification_method: 'Monitoring events and metrics',
          },
          {
            id: 'NIST_MANAGE_2_1',
            name: 'MANAGE-2.1: Risk Tracking',
            description: 'Risks are tracked and documented',
            category: 'risk_management',
            required: true,
            weight: 0.8,
            verification_method: 'Risk scores and sensitivity metrics',
          },
        ],
      },
      {
        id: 'HIPAA',
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act',
        controls: [
          {
            id: 'HIPAA_164_308_A_1',
            name: '§164.308(a)(1): Security Management',
            description: 'Implement security management processes',
            category: 'security',
            required: true,
            weight: 1.0,
            verification_method: 'Security audit trails',
          },
          {
            id: 'HIPAA_164_312_A_1',
            name: '§164.312(a)(1): Access Control',
            description: 'Implement access controls',
            category: 'access_control',
            required: true,
            weight: 0.9,
            verification_method: 'User/org ID tracking',
          },
          {
            id: 'HIPAA_164_312_B',
            name: '§164.312(b): Audit Controls',
            description: 'Implement audit controls',
            category: 'audit',
            required: true,
            weight: 0.9,
            verification_method: 'Audit trails',
          },
          {
            id: 'HIPAA_164_312_E_1',
            name: '§164.312(e)(1): Transmission Security',
            description: 'Implement integrity controls',
            category: 'integrity',
            required: true,
            weight: 0.8,
            verification_method: 'Content hashing and receipts',
          },
        ],
      },
    ]
  }

  /**
   * Get framework by ID
   */
  getFramework(id: string): ComplianceFramework | null {
    return this.frameworks.find((f) => f.id === id) || null
  }

  /**
   * Get all frameworks
   */
  getAllFrameworks(): ComplianceFramework[] {
    return this.frameworks
  }
}
