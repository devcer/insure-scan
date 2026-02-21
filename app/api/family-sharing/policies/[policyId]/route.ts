// Family Sharing Individual Policy API
// Handles family member access to specific shared insurance policies

import { NextRequest, NextResponse } from 'next/server'
import { VaultServiceImpl } from '@/lib/family-sharing/services/vault-service'
import { AuditService } from '@/lib/family-sharing/services/audit-service'

interface RouteParams {
  params: Promise<{
    policyId: string
  }>
}

// GET /api/family-sharing/policies/[policyId] - Get specific policy details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { policyId } = await params
    const { searchParams } = new URL(request.url)
    const familyMemberId = searchParams.get('familyMemberId')
    const action = searchParams.get('action')

    if (!familyMemberId) {
      return NextResponse.json(
        { error: 'familyMemberId is required' },
        { status: 400 }
      )
    }

    const vaultService = new VaultServiceImpl()
    const auditService = new AuditService()

    switch (action) {
      case 'summary':
        // Get policy summary data for quick reference
        const summaryData = await vaultService.getPolicySummaryData(familyMemberId, policyId)
        
        // Log summary access
        await auditService.logPolicyAccess(
          familyMemberId,
          policyId,
          'view_summary',
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          policyId,
          summary: summaryData
        })

      case 'document':
        // Get policy document reference
        const document = await vaultService.getPolicyDocument(familyMemberId, policyId)
        
        // Log document access
        await auditService.logPolicyAccess(
          familyMemberId,
          policyId,
          'view_document',
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          policyId,
          document
        })

      default:
        // Default: get detailed policy information
        const policyDetails = await vaultService.getPolicyDetails(familyMemberId, policyId)
        
        // Log detailed access
        await auditService.logPolicyAccess(
          familyMemberId,
          policyId,
          'view_details',
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        )

        return NextResponse.json({
          policyId,
          policy: policyDetails
        })
    }

  } catch (error) {
    console.error('Error fetching policy details:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied: You do not have permission to view this policy' },
          { status: 403 }
        )
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Policy not found or family member inactive' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch policy details' },
      { status: 500 }
    )
  }
}
