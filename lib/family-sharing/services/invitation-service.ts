// Invitation Service Implementation
// Handles secure invitation and verification process for family members

import { randomBytes, createHash } from 'crypto'
import { createSupabaseServerClient } from '../../supabase/server'
import { InvitationService } from '../types/services'
import { Invitation, FamilyMember, PermissionLevel } from '../types/core'
import type { Database } from '../../../types/database.types'

// Email service interface for sending invitations
interface EmailService {
  sendInvitationEmail(to: string, invitationToken: string, vaultOwnerName?: string): Promise<void>
}

// Simple email service implementation (placeholder for now)
class SimpleEmailService implements EmailService {
  async sendInvitationEmail(to: string, invitationToken: string, vaultOwnerName?: string): Promise<void> {
    // For now, just log the email details
    // In production, this would integrate with SendGrid, AWS SES, or similar
    console.log(`Sending invitation email to: ${to}`)
    console.log(`Invitation token: ${invitationToken}`)
    console.log(`From vault owner: ${vaultOwnerName || 'Unknown'}`)
    console.log(`Verification URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/family/verify?token=${invitationToken}`)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

export class InvitationServiceImpl implements InvitationService {
  private supabase = createSupabaseServerClient()
  private emailService: EmailService = new SimpleEmailService()

  /**
   * Generate a cryptographically secure invitation token
   */
  private generateInvitationToken(): string {
    // Generate 32 bytes of random data and encode as base64url
    const randomData = randomBytes(32)
    return randomData.toString('base64url')
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async sendInvitation(vaultOwnerId: string, email: string, permissions: PermissionLevel): Promise<Invitation> {
    // Validate inputs
    if (!vaultOwnerId || !email || !permissions) {
      throw new Error('Missing required parameters: vaultOwnerId, email, and permissions are required')
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    if (!['view_all', 'view_specific'].includes(permissions)) {
      throw new Error('Invalid permission level. Must be "view_all" or "view_specific"')
    }

    // Check if there's already a pending invitation for this email from this vault owner
    const { data: existingInvitation, error: checkError } = await this.supabase
      .from('family_invitations')
      .select('*')
      .eq('vault_owner_id', vaultOwnerId)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to check existing invitations: ${checkError.message}`)
    }

    if (existingInvitation) {
      throw new Error('A pending invitation already exists for this email address')
    }

    // Generate secure token and expiration (48 hours from now)
    const token = this.generateInvitationToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)

    // Create invitation record
    const { data: invitation, error: insertError } = await this.supabase
      .from('family_invitations')
      .insert({
        vault_owner_id: vaultOwnerId,
        email,
        permissions,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create invitation: ${insertError.message}`)
    }

    // Get vault owner name for email
    const { data: vaultOwner } = await this.supabase
      .from('users')
      .select('name, email')
      .eq('id', vaultOwnerId)
      .single()

    // Send invitation email
    try {
      await this.emailService.sendInvitationEmail(
        email, 
        token, 
        vaultOwner?.name || vaultOwner?.email || 'Unknown User'
      )
    } catch (emailError) {
      // If email fails, we should still return the invitation but log the error
      console.error('Failed to send invitation email:', emailError)
      // In production, you might want to mark the invitation as failed or retry
    }

    // Convert database row to domain object
    return {
      id: invitation.id,
      vaultOwnerId: invitation.vault_owner_id,
      email: invitation.email,
      permissions: invitation.permissions as PermissionLevel,
      token: invitation.token,
      status: invitation.status as 'pending',
      createdAt: new Date(invitation.created_at),
      expiresAt: new Date(invitation.expires_at),
      acceptedAt: invitation.accepted_at ? new Date(invitation.accepted_at) : undefined
    }
  }

  async verifyInvitation(token: string): Promise<FamilyMember> {
    if (!token) {
      throw new Error('Invitation token is required')
    }

    // Find the invitation by token
    const { data: invitation, error: findError } = await this.supabase
      .from('family_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (findError || !invitation) {
      throw new Error('Invalid or expired invitation token')
    }

    // Check if invitation has expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    
    if (now > expiresAt) {
      // Mark invitation as expired
      await this.supabase
        .from('family_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      
      throw new Error('Invitation has expired')
    }

    // Check if family member already exists for this email and vault owner
    const { data: existingMember, error: memberCheckError } = await this.supabase
      .from('family_members')
      .select('*')
      .eq('vault_owner_id', invitation.vault_owner_id)
      .eq('email', invitation.email)
      .eq('status', 'active')
      .single()

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing family member: ${memberCheckError.message}`)
    }

    if (existingMember) {
      throw new Error('Family member already exists for this email address')
    }

    // Create family member record
    const { data: familyMember, error: createError } = await this.supabase
      .from('family_members')
      .insert({
        vault_owner_id: invitation.vault_owner_id,
        email: invitation.email,
        permissions: invitation.permissions,
        specific_policy_ids: invitation.permissions === 'view_specific' ? [] : null,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create family member: ${createError.message}`)
    }

    // Mark invitation as accepted
    const { error: updateError } = await this.supabase
      .from('family_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Failed to update invitation status:', updateError)
      // Don't throw here as the family member was created successfully
    }

    // Send notification to vault owner
    try {
      const { data: vaultOwner } = await this.supabase
        .from('users')
        .select('name, email')
        .eq('id', invitation.vault_owner_id)
        .single()

      // For now, just log the notification
      // In production, this would send an actual email
      console.log(`Notification: ${invitation.email} has accepted the invitation from ${vaultOwner?.name || vaultOwner?.email}`)
    } catch (notificationError) {
      console.error('Failed to send acceptance notification:', notificationError)
      // Don't throw as the main operation succeeded
    }

    // Convert database row to domain object
    return {
      id: familyMember.id,
      vaultOwnerId: familyMember.vault_owner_id,
      email: familyMember.email,
      permissions: familyMember.permissions as PermissionLevel,
      specificPolicyIds: familyMember.specific_policy_ids || undefined,
      status: familyMember.status as 'active',
      createdAt: new Date(familyMember.created_at),
      lastAccessAt: familyMember.last_access_at ? new Date(familyMember.last_access_at) : undefined
    }
  }

  async resendInvitation(invitationId: string): Promise<void> {
    if (!invitationId) {
      throw new Error('Invitation ID is required')
    }

    // Find the invitation
    const { data: invitation, error: findError } = await this.supabase
      .from('family_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (findError || !invitation) {
      throw new Error('Invitation not found')
    }

    // Check if invitation is in a resendable state
    if (invitation.status !== 'pending') {
      throw new Error(`Cannot resend invitation with status: ${invitation.status}`)
    }

    // Generate new token and extend expiration
    const newToken = this.generateInvitationToken()
    const newExpiresAt = new Date()
    newExpiresAt.setHours(newExpiresAt.getHours() + 48)

    // Update invitation with new token and expiration
    const { error: updateError } = await this.supabase
      .from('family_invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString()
      })
      .eq('id', invitationId)

    if (updateError) {
      throw new Error(`Failed to update invitation: ${updateError.message}`)
    }

    // Get vault owner name for email
    const { data: vaultOwner } = await this.supabase
      .from('users')
      .select('name, email')
      .eq('id', invitation.vault_owner_id)
      .single()

    // Resend invitation email
    try {
      await this.emailService.sendInvitationEmail(
        invitation.email,
        newToken,
        vaultOwner?.name || vaultOwner?.email || 'Unknown User'
      )
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError)
      throw new Error('Failed to send invitation email')
    }
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    if (!invitationId) {
      throw new Error('Invitation ID is required')
    }

    // Find the invitation
    const { data: invitation, error: findError } = await this.supabase
      .from('family_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (findError || !invitation) {
      throw new Error('Invitation not found')
    }

    // Check if invitation can be revoked
    if (invitation.status === 'accepted') {
      throw new Error('Cannot revoke an accepted invitation. Use family member management instead.')
    }

    if (invitation.status === 'revoked') {
      throw new Error('Invitation is already revoked')
    }

    // Update invitation status to revoked
    const { error: updateError } = await this.supabase
      .from('family_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    if (updateError) {
      throw new Error(`Failed to revoke invitation: ${updateError.message}`)
    }
  }

  /**
   * Expire old invitations that have passed their expiration date
   * This method should be called periodically (e.g., via cron job)
   */
  async expireOldInvitations(): Promise<number> {
    const { data: expiredInvitations, error } = await this.supabase
      .from('family_invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id, email, vault_owner_id')

    if (error) {
      throw new Error(`Failed to expire old invitations: ${error.message}`)
    }

    // Notify vault owners of expired invitations
    for (const invitation of expiredInvitations || []) {
      try {
        const { data: vaultOwner } = await this.supabase
          .from('users')
          .select('name, email')
          .eq('id', invitation.vault_owner_id)
          .single()

        // For now, just log the notification
        // In production, this would send an actual email
        console.log(`Notification: Invitation to ${invitation.email} has expired for vault owner ${vaultOwner?.name || vaultOwner?.email}`)
      } catch (notificationError) {
        console.error('Failed to send expiration notification:', notificationError)
      }
    }

    return expiredInvitations?.length || 0
  }

  async getInvitations(vaultOwnerId: string): Promise<Invitation[]> {
    if (!vaultOwnerId) {
      throw new Error('vaultOwnerId is required')
    }

    const { data: invitations, error } = await this.supabase
      .from('family_invitations')
      .select('*')
      .eq('vault_owner_id', vaultOwnerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`)
    }

    // Convert database rows to domain objects
    return invitations.map(invitation => ({
      id: invitation.id,
      vaultOwnerId: invitation.vault_owner_id,
      email: invitation.email,
      permissions: invitation.permissions as PermissionLevel,
      token: invitation.token,
      status: invitation.status as any,
      createdAt: new Date(invitation.created_at),
      expiresAt: new Date(invitation.expires_at),
      acceptedAt: invitation.accepted_at ? new Date(invitation.accepted_at) : undefined
    }))
  }
}
