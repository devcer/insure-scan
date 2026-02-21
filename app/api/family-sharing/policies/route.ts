// Family Sharing Policies API
// Handles family member access to shared insurance policies

import { NextRequest, NextResponse } from 'next/server'
import { VaultServiceImpl } from '@/lib/family-sharing/services/vault-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

// GET /api/family-sharing/policies - Get shared policies for family member
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyMemberId = searchParams.get('familyMemberId')
    const action = searchParams.get('action')
    const query = searchParams.get('query')

    if (!familyMemberId) {
      return NextResponse.json(
        { error: 'familyMemberId is required' },
        { status: 400 }
      )
    }

    const vaultService = new VaultServiceImpl()
    const auditService = new AuditService()

    switch (action) {
      case 'search':
        // Search shared policies
        if (!query) {
          return NextResponse.json(
            { error: 'query parameter is required for search action' },
            { status: 400 }
          )
        }

        const searchResults = await vaultService.searchPolicies(familyMemberId, query)
        
        // Log search activity
        await auditService.logPolicyAccess(
          familyMemberId,
          `search:${query}`,
          'search',
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          policies: searchResults,
          count: searchResults.length,
          searchTerm: query
        })

      case 'critical':
        // Get critical policies requiring attention
        const criticalPolicies = await vaultService.getCriticalPolicies(familyMemberId)
        
        return NextResponse.json({
          policies: criticalPolicies,
          count: criticalPolicies.length,
          type: 'critical'
        })

      default:
        // Default: get all shared policies
        const policies = await vaultService.getSharedPolicies(familyMemberId)
        
        // Log policy access
        await auditService.logPolicyAccess(
          familyMemberId,
          'bulk_view',
          'view_summary',
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          policies,
          count: policies.length
        })
    }

  } catch (error) {
    console.error('Error fetching shared policies:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return NextResponse.json(
          { error: 'Family member not found or inactive' },
          { status: 404 }
        )
      }
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch shared policies' },
      { status: 500 }
    )
  }
}
