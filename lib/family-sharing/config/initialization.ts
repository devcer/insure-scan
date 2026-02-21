// Family Sharing Initialization
// Handles system startup, configuration validation, and service initialization

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { FAMILY_SHARING_CONFIG } from './index'
import { familyShareService } from '../services/family-sharing-service'

/**
 * Initialize the family sharing system
 * Validates configuration, checks database connectivity, and sets up services
 */
export async function initializeFamilySharing(): Promise<{
  success: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 1. Validate configuration
    console.log('🔧 Validating family sharing configuration...')
    
    if (FAMILY_SHARING_CONFIG.INVITATION_EXPIRY_HOURS < 1) {
      errors.push('Invitation expiry hours must be at least 1')
    }
    
    if (FAMILY_SHARING_CONFIG.MAX_INVITATIONS_PER_VAULT < 1) {
      errors.push('Max invitations per vault must be at least 1')
    }
    
    if (FAMILY_SHARING_CONFIG.SESSION_TIMEOUT_MINUTES < 5) {
      warnings.push('Session timeout is very short (< 5 minutes)')
    }

    // 2. Check database connectivity and schema
    console.log('🗄️ Checking database connectivity...')
    
    const supabase = createSupabaseServerClient()
    
    // Test basic connectivity
    const { error: connectError } = await supabase
      .from('family_members')
      .select('count')
      .limit(1)
    
    if (connectError) {
      errors.push(`Database connectivity error: ${connectError.message}`)
    }

    // Check required tables exist
    const requiredTables = [
      'family_members',
      'family_invitations', 
      'family_security_alerts',
      'family_audit_entries'
    ] as const

    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        errors.push(`Required table '${table}' not found or accessible`)
      }
    }

    // 3. Validate environment variables
    console.log('🌍 Checking environment configuration...')
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      warnings.push('NEXT_PUBLIC_APP_URL not set - invitation links may not work correctly')
    }
    
    if (!process.env.NEXTAUTH_SECRET) {
      errors.push('NEXTAUTH_SECRET not configured - authentication will fail')
    }

    // 4. Test service health
    console.log('🏥 Testing service health...')
    
    const healthResults = await familyShareService.healthCheck()
    const unhealthyServices = healthResults.filter((result: { service: string; status: 'healthy' | 'error'; message?: string }) => result.status === 'error')
    
    if (unhealthyServices.length > 0) {
      errors.push(`Unhealthy services: ${unhealthyServices.map((s: { service: any }) => s.service).join(', ')}`)
    }

    // 5. Initialize security monitoring
    console.log('🔒 Initializing security monitoring...')
    
    // This would set up any background monitoring processes
    // For now, just validate the security configuration
    if (FAMILY_SHARING_CONFIG.MAX_LOGIN_ATTEMPTS < 3) {
      warnings.push('Max login attempts is very low - may cause usability issues')
    }

    // 6. Set up cleanup tasks
    console.log('🧹 Setting up cleanup tasks...')
    
    // In a production system, you might set up cron jobs or background tasks here
    // For now, just log that cleanup is configured
    console.log(`Audit retention: ${FAMILY_SHARING_CONFIG.AUDIT_RETENTION_DAYS} days`)

    if (errors.length === 0) {
      console.log('✅ Family sharing system initialized successfully')
      return { success: true, errors, warnings }
    } else {
      console.error('❌ Family sharing system initialization failed')
      return { success: false, errors, warnings }
    }

  } catch (error) {
    console.error('💥 Critical error during family sharing initialization:', error)
    errors.push(`Critical initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false, errors, warnings }
  }
}

/**
 * Validate family sharing system configuration
 * Can be called periodically to ensure system health
 */
export async function validateSystemHealth(): Promise<{
  healthy: boolean
  issues: string[]
  lastChecked: Date
}> {
  const issues: string[] = []

  try {
    // Check service health
    const healthResults = await familyShareService.healthCheck()
    const unhealthyServices = healthResults.filter((result: { service: string; status: 'healthy' | 'error'; message?: string }) => result.status === 'error')
    
    if (unhealthyServices.length > 0) {
      issues.push(`Unhealthy services: ${unhealthyServices.map((s: { service: string; status: 'healthy' | 'error'; message?: string }) => `${s.service} (${s.message || 'Unknown error'})`).join(', ')}`)
    }

    // Check database performance
    const supabase = createSupabaseServerClient()
    const startTime = Date.now()
    
    await supabase
      .from('family_members')
      .select('count')
      .limit(1)
    
    const queryTime = Date.now() - startTime
    
    if (queryTime > 5000) { // 5 seconds
      issues.push(`Database queries are slow (${queryTime}ms)`)
    }

    // Check for system alerts
    const alerts = await familyShareService.getSecurityAlerts('system-check')
    const criticalAlerts = alerts.filter((alert: { severity: string }) => alert.severity === 'high')
    
    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical security alerts`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      lastChecked: new Date()
    }

  } catch (error) {
    issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      healthy: false,
      issues,
      lastChecked: new Date()
    }
  }
}

/**
 * Get system information for debugging and monitoring
 */
export function getSystemInfo() {
  return {
    config: FAMILY_SHARING_CONFIG,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    timestamp: new Date().toISOString()
  }
}
