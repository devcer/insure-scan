// Policy Formatting Utilities
// Standardized policy formatting for family member view with critical information highlighting

import { PolicySummary, PolicyDetails, ContactInfo } from '../types/core'

/**
 * Policy formatting configuration for highlighting critical information
 */
export interface PolicyFormattingConfig {
  highlightCriticalInfo: boolean
  includeContactInfo: boolean
  showSensitiveData: boolean
  dateFormat: 'short' | 'long' | 'iso'
  currencyFormat: 'USD' | 'compact'
}

/**
 * Default formatting configuration for family members (secure, read-only)
 */
export const DEFAULT_FAMILY_FORMATTING: PolicyFormattingConfig = {
  highlightCriticalInfo: true,
  includeContactInfo: true,
  showSensitiveData: false, // Never show sensitive data to family members
  dateFormat: 'short',
  currencyFormat: 'USD'
}

/**
 * Critical policy information that should be highlighted
 */
export interface CriticalPolicyInfo {
  expirationWarning: boolean
  paymentOverdue: boolean
  highValue: boolean
  recentChanges: boolean
}

/**
 * Formatted policy summary for display
 */
export interface FormattedPolicySummary extends PolicySummary {
  formattedPremium: string
  formattedExpirationDate: string
  criticalInfo: CriticalPolicyInfo
  displayPriority: number
  statusColor: 'green' | 'yellow' | 'red' | 'gray'
}

/**
 * Formatted policy details for display
 */
export interface FormattedPolicyDetails extends PolicyDetails {
  formattedCoverageAmount: string
  formattedDeductible: string
  formattedPremium: string
  formattedExpirationDate: string
  criticalInfo: CriticalPolicyInfo
  highlightedBenefits: Array<{ benefit: string; isHighlighted: boolean }>
  safeContactInfo: ContactInfo
}

/**
 * Policy summary generation without full document access
 */
export interface PolicySummaryData {
  basicInfo: {
    type: string
    provider: string
    policyNumber: string
    status: string
  }
  financialInfo: {
    premium: number
    coverageAmount: number
    deductible: number
  }
  dates: {
    expirationDate: Date
    lastUpdated: Date
  }
  criticalAlerts: string[]
}

export class PolicyFormatter {
  private config: PolicyFormattingConfig

  constructor(config: PolicyFormattingConfig = DEFAULT_FAMILY_FORMATTING) {
    this.config = config
  }

  /**
   * Format policy summary for family member display
   * Requirements: 7.1, 7.2
   */
  formatPolicySummary(policy: PolicySummary): FormattedPolicySummary {
    const criticalInfo = this.analyzeCriticalInfo(policy)
    
    return {
      ...policy,
      formattedPremium: this.formatCurrency(policy.premium),
      formattedExpirationDate: this.formatDate(policy.expirationDate),
      criticalInfo,
      displayPriority: this.calculateDisplayPriority(policy, criticalInfo),
      statusColor: this.getStatusColor(policy.status, criticalInfo)
    }
  }

  /**
   * Format policy details for family member display
   * Requirements: 7.1, 7.2, 7.4
   */
  formatPolicyDetails(policy: PolicyDetails): FormattedPolicyDetails {
    const criticalInfo = this.analyzeCriticalInfo(policy)
    
    return {
      ...policy,
      formattedCoverageAmount: this.formatCurrency(policy.coverageAmount),
      formattedDeductible: this.formatCurrency(policy.deductible),
      formattedPremium: this.formatCurrency(policy.premium),
      formattedExpirationDate: this.formatDate(policy.expirationDate),
      criticalInfo,
      highlightedBenefits: this.highlightKeyBenefits(policy.keyBenefits),
      safeContactInfo: this.sanitizeContactInfo(policy.contactInfo)
    }
  }

  /**
   * Generate policy summary without full document access
   * Requirements: 7.4
   */
  generatePolicySummary(policy: PolicyDetails): PolicySummaryData {
    const criticalAlerts = this.generateCriticalAlerts(policy)
    
    return {
      basicInfo: {
        type: policy.type,
        provider: policy.provider,
        policyNumber: this.sanitizePolicyNumber(policy.policyNumber),
        status: policy.status
      },
      financialInfo: {
        premium: policy.premium,
        coverageAmount: policy.coverageAmount,
        deductible: policy.deductible
      },
      dates: {
        expirationDate: policy.expirationDate,
        lastUpdated: new Date() // This would come from the database in real implementation
      },
      criticalAlerts
    }
  }

  /**
   * Analyze critical information that needs highlighting
   * Requirements: 7.2
   */
  private analyzeCriticalInfo(policy: PolicySummary | PolicyDetails): CriticalPolicyInfo {
    const now = new Date()
    const expirationDate = new Date(policy.expirationDate)
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      expirationWarning: daysUntilExpiration <= 30 && daysUntilExpiration > 0,
      paymentOverdue: policy.status === 'Overdue' || daysUntilExpiration < 0,
      highValue: policy.premium > 1000 || ('coverageAmount' in policy && policy.coverageAmount > 100000),
      recentChanges: false // This would be determined by comparing with previous versions
    }
  }

  /**
   * Calculate display priority for sorting policies
   * Requirements: 7.2
   */
  private calculateDisplayPriority(policy: PolicySummary, criticalInfo: CriticalPolicyInfo): number {
    let priority = 0
    
    // Higher priority for critical issues
    if (criticalInfo.paymentOverdue) priority += 100
    if (criticalInfo.expirationWarning) priority += 50
    if (criticalInfo.recentChanges) priority += 25
    if (criticalInfo.highValue) priority += 10
    
    // Higher priority for certain policy types
    if (policy.type === 'Health Insurance') priority += 5
    if (policy.type === 'Auto Insurance') priority += 3
    if (policy.type === 'Home Insurance') priority += 3
    
    return priority
  }

  /**
   * Get status color for UI display
   * Requirements: 7.2
   */
  private getStatusColor(status: string, criticalInfo: CriticalPolicyInfo): 'green' | 'yellow' | 'red' | 'gray' {
    if (criticalInfo.paymentOverdue) return 'red'
    if (criticalInfo.expirationWarning) return 'yellow'
    
    switch (status) {
      case 'Active':
        return 'green'
      case 'Payment Due':
        return 'yellow'
      case 'Overdue':
        return 'red'
      case 'Cancelled':
        return 'gray'
      default:
        return 'gray'
    }
  }

  /**
   * Highlight key benefits for easy scanning
   * Requirements: 7.2
   */
  private highlightKeyBenefits(benefits: string[]): Array<{ benefit: string; isHighlighted: boolean }> {
    const highlightKeywords = ['liability', 'coverage', 'protection', 'benefit', 'medical', 'emergency']
    
    return benefits.map(benefit => ({
      benefit,
      isHighlighted: highlightKeywords.some(keyword => 
        benefit.toLowerCase().includes(keyword)
      )
    }))
  }

  /**
   * Sanitize contact information for family member view
   * Requirements: 7.1 (security)
   */
  private sanitizeContactInfo(contactInfo: ContactInfo): ContactInfo {
    return {
      phone: contactInfo.phone ? this.maskPhoneNumber(contactInfo.phone) : undefined,
      email: contactInfo.email, // Email is generally safe to show
      address: undefined, // Don't show full addresses to family members
      website: contactInfo.website
    }
  }

  /**
   * Sanitize policy number for display
   * Requirements: 7.1 (security)
   */
  private sanitizePolicyNumber(policyNumber: string): string {
    if (!policyNumber || policyNumber === 'N/A') return policyNumber
    
    // Show only last 4 characters for security
    if (policyNumber.length > 4) {
      return '****' + policyNumber.slice(-4)
    }
    
    return policyNumber
  }

  /**
   * Mask phone number for privacy
   * Requirements: 7.1 (security)
   */
  private maskPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ***-${digits.slice(-4)}`
    } else if (digits.length === 11) {
      return `+${digits[0]} (${digits.slice(1, 4)}) ***-${digits.slice(-4)}`
    }
    
    return '***-***-' + digits.slice(-4)
  }

  /**
   * Generate critical alerts for policy
   * Requirements: 7.2
   */
  private generateCriticalAlerts(policy: PolicyDetails): string[] {
    const alerts: string[] = []
    const criticalInfo = this.analyzeCriticalInfo(policy)
    
    if (criticalInfo.paymentOverdue) {
      alerts.push('Payment overdue - Policy may be at risk of cancellation')
    }
    
    if (criticalInfo.expirationWarning) {
      const daysUntilExpiration = Math.ceil(
        (policy.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      alerts.push(`Policy expires in ${daysUntilExpiration} days - Renewal may be needed`)
    }
    
    if (criticalInfo.highValue) {
      alerts.push('High-value policy - Important for financial planning')
    }
    
    return alerts
  }

  /**
   * Format currency values
   * Requirements: 7.1
   */
  private formatCurrency(amount: number): string {
    if (this.config.currencyFormat === 'compact') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(amount)
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  /**
   * Format dates consistently
   * Requirements: 7.1
   */
  private formatDate(date: Date): string {
    switch (this.config.dateFormat) {
      case 'long':
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date)
      
      case 'iso':
        return date.toISOString().split('T')[0]
      
      case 'short':
      default:
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).format(date)
    }
  }
}

// Export singleton instance with default family-safe configuration
export const familyPolicyFormatter = new PolicyFormatter(DEFAULT_FAMILY_FORMATTING)

/**
 * Utility functions for quick formatting
 */
export const PolicyFormattingUtils = {
  /**
   * Quick format for policy summary display
   */
  formatSummaryForDisplay: (policy: PolicySummary): FormattedPolicySummary => {
    return familyPolicyFormatter.formatPolicySummary(policy)
  },

  /**
   * Quick format for policy details display
   */
  formatDetailsForDisplay: (policy: PolicyDetails): FormattedPolicyDetails => {
    return familyPolicyFormatter.formatPolicyDetails(policy)
  },

  /**
   * Sort policies by priority (critical issues first)
   */
  sortByPriority: (policies: FormattedPolicySummary[]): FormattedPolicySummary[] => {
    return policies.sort((a, b) => b.displayPriority - a.displayPriority)
  },

  /**
   * Filter policies by status
   */
  filterByStatus: (policies: FormattedPolicySummary[], statuses: string[]): FormattedPolicySummary[] => {
    return policies.filter(policy => statuses.includes(policy.status))
  },

  /**
   * Get policies requiring attention
   */
  getCriticalPolicies: (policies: FormattedPolicySummary[]): FormattedPolicySummary[] => {
    return policies.filter(policy => 
      policy.criticalInfo.paymentOverdue || 
      policy.criticalInfo.expirationWarning
    )
  }
}
