/**
 * Shadow AI Detection
 * 
 * Identifies unauthorized AI tool usage based on approved tools whitelist
 */

export interface ShadowAIResult {
  isShadowAI: boolean
  toolName: string
  toolCategory: string | null
  detectionMethod: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
}

export interface ToolDefinition {
  name: string
  category: 'chatbot' | 'code_generator' | 'image_generator' | 'productivity' | 'other'
  domains: string[]
  approved: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export class ShadowAIDetector {
  // Known AI Tools Database
  private static readonly knownTools: ToolDefinition[] = [
    // Chatbots
    {
      name: 'ChatGPT',
      category: 'chatbot',
      domains: ['chat.openai.com', 'chatgpt.com'],
      approved: false,
      riskLevel: 'HIGH',
    },
    {
      name: 'ChatGPT Enterprise',
      category: 'chatbot',
      domains: ['chat.openai.com/enterprise'],
      approved: true,
      riskLevel: 'LOW',
    },
    {
      name: 'Claude',
      category: 'chatbot',
      domains: ['claude.ai', 'console.anthropic.com'],
      approved: false,
      riskLevel: 'HIGH',
    },
    {
      name: 'Claude Pro',
      category: 'chatbot',
      domains: ['claude.ai/pro'],
      approved: true,
      riskLevel: 'LOW',
    },
    {
      name: 'Google Gemini',
      category: 'chatbot',
      domains: ['gemini.google.com', 'bard.google.com'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    {
      name: 'Microsoft Copilot',
      category: 'chatbot',
      domains: ['copilot.microsoft.com', 'bing.com/chat'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    {
      name: 'Perplexity',
      category: 'chatbot',
      domains: ['perplexity.ai'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    
    // Code Generators
    {
      name: 'GitHub Copilot',
      category: 'code_generator',
      domains: ['github.com/copilot', 'copilot.github.com'],
      approved: true,
      riskLevel: 'LOW',
    },
    {
      name: 'Amazon CodeWhisperer',
      category: 'code_generator',
      domains: ['aws.amazon.com/codewhisperer'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    {
      name: 'Tabnine',
      category: 'code_generator',
      domains: ['tabnine.com'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    {
      name: 'Cursor',
      category: 'code_generator',
      domains: ['cursor.sh', 'cursor.com'],
      approved: false,
      riskLevel: 'HIGH',
    },
    
    // Image Generators
    {
      name: 'Midjourney',
      category: 'image_generator',
      domains: ['midjourney.com', 'discord.com/channels/midjourney'],
      approved: false,
      riskLevel: 'CRITICAL',
    },
    {
      name: 'DALL-E',
      category: 'image_generator',
      domains: ['labs.openai.com', 'openai.com/dall-e'],
      approved: false,
      riskLevel: 'CRITICAL',
    },
    {
      name: 'Stable Diffusion',
      category: 'image_generator',
      domains: ['stability.ai', 'stablediffusionweb.com'],
      approved: false,
      riskLevel: 'HIGH',
    },
    
    // Productivity
    {
      name: 'Notion AI',
      category: 'productivity',
      domains: ['notion.so', 'notion.com'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    {
      name: 'Jasper',
      category: 'productivity',
      domains: ['jasper.ai'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
    {
      name: 'Copy.ai',
      category: 'productivity',
      domains: ['copy.ai'],
      approved: false,
      riskLevel: 'MEDIUM',
    },
  ]

  /**
   * Detect if tool is shadow AI
   */
  static detect(
    toolName: string,
    url?: string,
    approvedTools?: string[]
  ): ShadowAIResult {
    // Find tool in known tools database
    const tool = this.findTool(toolName, url)

    if (!tool) {
      // Unknown tool - treat as shadow AI
      return {
        isShadowAI: true,
        toolName,
        toolCategory: null,
        detectionMethod: 'unknown_tool',
        riskLevel: 'HIGH',
        reason: 'Tool not recognized in approved tools database',
      }
    }

    // Check if explicitly approved
    const isApproved = approvedTools
      ? approvedTools.includes(tool.name) || approvedTools.includes(toolName)
      : tool.approved

    return {
      isShadowAI: !isApproved,
      toolName: tool.name,
      toolCategory: tool.category,
      detectionMethod: url ? 'domain_matching' : 'tool_name',
      riskLevel: isApproved ? 'LOW' : tool.riskLevel,
      reason: isApproved
        ? 'Tool is on approved list'
        : `Unapproved ${tool.category} tool detected`,
    }
  }

  /**
   * Find tool by name or URL
   */
  private static findTool(toolName: string, url?: string): ToolDefinition | null {
    // Normalize tool name
    const normalizedName = toolName.toLowerCase().trim()

    // First try exact match by name
    let tool = this.knownTools.find((t) => t.name.toLowerCase() === normalizedName)

    // If no match and URL provided, try domain matching
    if (!tool && url) {
      try {
        const urlHost = new URL(url).hostname.toLowerCase()
        tool = this.knownTools.find((t) =>
          t.domains.some((domain) => urlHost.includes(domain))
        )
      } catch {
        // Invalid URL, skip domain matching
      }
    }

    // Try partial name matching
    if (!tool) {
      tool = this.knownTools.find((t) =>
        t.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(t.name.toLowerCase())
      )
    }

    return tool || null
  }

  /**
   * Get all approved tools
   */
  static getApprovedTools(): string[] {
    return this.knownTools.filter((t) => t.approved).map((t) => t.name)
  }

  /**
   * Get all known tools
   */
  static getAllKnownTools(): ToolDefinition[] {
    return this.knownTools
  }

  /**
   * Get tools by category
   */
  static getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
    return this.knownTools.filter((t) => t.category === category)
  }

  /**
   * Get tool risk level
   */
  static getToolRiskLevel(toolName: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const tool = this.findTool(toolName)
    return tool ? tool.riskLevel : 'HIGH'
  }

  /**
   * Check if URL is AI tool domain
   */
  static isAIToolDomain(url: string): boolean {
    try {
      const urlHost = new URL(url).hostname.toLowerCase()
      return this.knownTools.some((t) =>
        t.domains.some((domain) => urlHost.includes(domain))
      )
    } catch {
      return false
    }
  }

  /**
   * Add custom tool definition
   */
  static addCustomTool(tool: ToolDefinition): void {
    this.knownTools.push(tool)
  }

  /**
   * Update tool approval status
   */
  static updateToolApproval(toolName: string, approved: boolean): boolean {
    const tool = this.findTool(toolName)
    if (tool) {
      tool.approved = approved
      tool.riskLevel = approved ? 'LOW' : tool.riskLevel
      return true
    }
    return false
  }
}
