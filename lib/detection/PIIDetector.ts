/**
 * PII Detection and Sensitivity Scoring
 * 
 * Detects personally identifiable information and calculates
 * sensitivity scores for content classification.
 */

export interface PIIDetectionResult {
  detected: boolean
  types: string[]
  sensitivityScore: number
  classification: 'PUBLIC' | 'CONFIDENTIAL' | 'HIGHLY_RESTRICTED'
  matches: PIIMatch[]
}

export interface PIIMatch {
  type: string
  value: string
  redacted: string
  position: number
}

export class PIIDetector {
  // PII Patterns
  private static readonly patterns = {
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    PHONE: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    API_KEY: /\b[A-Za-z0-9]{32,}\b/g, // Generic API key pattern
    AWS_KEY: /\b(AKIA[0-9 A-Z]{16})\b/g,
    AZURE_KEY: /\b[a-zA-Z0-9/+]{40,}\b/g,
    IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    ADDRESS: /\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi,
    // Healthcare
    MRN: /\b(MRN|Medical Record Number)[\s:-]*\d{6,10}\b/gi,
    NPI: /\b\d{10}\b/g, // National Provider Identifier
    // Finance
    ROUTING_NUMBER: /\b\d{9}\b/g,
    ACCOUNT_NUMBER: /\b\d{10,17}\b/g,
    // Identity
    PASSPORT: /\b[A-Z]{1,2}\d{6,9}\b/g,
    DRIVERS_LICENSE: /\b[A-Z]{1,2}\d{5,8}\b/g,
  }

  /**
   * Detect PII in content
   */
  static detect(content: string): PIIDetectionResult {
    const matches: PIIMatch[] = []
    const types = new Set<string>()

    // Scan for each PII type
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const regex = new RegExp(pattern)
      let match

      while ((match = regex.exec(content)) !== null) {
        types.add(type)
        matches.push({
          type,
          value: match[0],
          redacted: this.redact(type, match[0]),
          position: match.index,
        })
      }
    }

    const detected = matches.length > 0
    const sensitivityScore = this.calculateSensitivity(types, matches)
    const classification = this.classify(sensitivityScore)

    return {
      detected,
      types: Array.from(types),
      sensitivityScore,
      classification,
      matches,
    }
  }

  /**
   * Calculate sensitivity score (0.00 - 1.00)
   */
  private static calculateSensitivity(types: Set<string>, matches: PIIMatch[]): number {
    if (types.size === 0) return 0.0

    // Base scores for different PII types
    const typeScores: Record<string, number> = {
      SSN: 1.0,
      CREDIT_CARD: 1.0,
      API_KEY: 0.95,
      AWS_KEY: 1.0,
      AZURE_KEY: 0.95,
      MRN: 0.9,
      NPI: 0.85,
      PASSPORT: 0.9,
      DRIVERS_LICENSE: 0.85,
      ROUTING_NUMBER: 0.8,
      ACCOUNT_NUMBER: 0.8,
      EMAIL: 0.5,
      PHONE: 0.6,
      ADDRESS: 0.7,
      IP_ADDRESS: 0.4,
    }

    // Calculate weighted average
    let totalScore = 0
    let weight = 0

    for (const type of types) {
      const score = typeScores[type] || 0.5
      const count = matches.filter((m) => m.type === type).length
      totalScore += score * count
      weight += count
    }

    // Normalize to 0-1 range
    const baseScore = totalScore / weight

    // Increase score for multiple PII types
    const typeMultiplier = Math.min(1 + (types.size - 1) * 0.1, 1.3)

    // Cap at 1.0
    return Math.min(baseScore * typeMultiplier, 1.0)
  }

  /**
   * Classify content based on sensitivity score
   */
  private static classify(score: number): 'PUBLIC' | 'CONFIDENTIAL' | 'HIGHLY_RESTRICTED' {
    if (score >= 0.8) return 'HIGHLY_RESTRICTED'
    if (score >= 0.5) return 'CONFIDENTIAL'
    return 'PUBLIC'
  }

  /**
   * Redact PII value
   */
  private static redact(type: string, value: string): string {
    switch (type) {
      case 'SSN':
        return `***-**-${value.slice(-4)}`
      case 'CREDIT_CARD':
        return `****-****-****-${value.slice(-4).replace(/\D/g, '')}`
      case 'EMAIL':
        const [local, domain] = value.split('@')
        return `${local[0]}***@${domain}`
      case 'PHONE':
        return `***-***-${value.slice(-4)}`
      case 'API_KEY':
      case 'AWS_KEY':
      case 'AZURE_KEY':
        return `${value.slice(0, 4)}...${value.slice(-4)}`
      default:
        return '***REDACTED***'
    }
  }

  /**
   * Redact all PII in content
   */
  static redactContent(content: string): string {
    let redacted = content

    for (const [type, pattern] of Object.entries(this.patterns)) {
      redacted = redacted.replace(pattern, (match) => this.redact(type, match))
    }

    return redacted
  }

  /**
   * Check if content contains specific PII type
   */
  static containsType(content: string, piiType: keyof typeof PIIDetector.patterns): boolean {
    const pattern = this.patterns[piiType]
    return pattern.test(content)
  }

  /**
   * Get PII summary statistics
   */
  static getSummary(content: string): {
    totalMatches: number
    uniqueTypes: number
    highestSensitivity: number
    typeCounts: Record<string, number>
  } {
    const result = this.detect(content)

    const typeCounts: Record<string, number> = {}
    for (const match of result.matches) {
      typeCounts[match.type] = (typeCounts[match.type] || 0) + 1
    }

    return {
      totalMatches: result.matches.length,
      uniqueTypes: result.types.length,
      highestSensitivity: result.sensitivityScore,
      typeCounts,
    }
  }
}
