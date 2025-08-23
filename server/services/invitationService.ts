import crypto from "crypto";
import { storage } from "../storage";
import { emailService } from "./emailService";
import type { userRoleEnum } from "@shared/schema";

export class InvitationService {
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now
    return expirationDate;
  }

  async createInvitation(email: string, role: string, invitedById: string): Promise<{ success: boolean; error?: string; invitation?: any }> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: "User with this email already exists" };
      }

      // Check if there's already a pending invitation for this email
      const existingInvitation = await storage.getInvitationByEmail(email);
      if (existingInvitation && existingInvitation.status === 'pending') {
        return { success: false, error: "An invitation for this email is already pending" };
      }

      // Create new invitation
      const token = this.generateToken();
      const expiresAt = this.generateExpirationDate();

      const invitation = await storage.createInvitation({
        email,
        role: role as "head_admin" | "admin" | "founder" | "strategist" | "designer",
        token,
        invitedBy: invitedById,
        expiresAt,
      });

      // Send invitation email
      console.log('🔄 About to send invitation email...');
      await this.sendInvitationEmail(email, token, role);
      console.log('✅ Invitation email sending completed');

      return { success: true, invitation };
    } catch (error) {
      console.error('Error creating invitation:', error);
      return { success: false, error: "Failed to create invitation" };
    }
  }

  private async sendInvitationEmail(email: string, token: string, role: string): Promise<void> {
    console.log(`📧 sendInvitationEmail called for ${email} with role ${role}`);
    
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:5173'}/invite/${token}`;
    
    const subject = "You're invited to join OutreachX";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">OutreachX</h1>
          <p style="color: #6b7280; margin: 5px 0;">AI-Powered Lead Outreach Platform</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            You have been invited to join OutreachX as a <strong>${role}</strong>. 
            OutreachX is an AI-powered platform that helps teams generate personalized 
            cold emails, manage leads, and track outreach performance.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: 500;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            This invitation will expire in 7 days. If you can't click the button above, 
            copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin-top: 5px;">
            ${inviteUrl}
          </p>
        </div>
        
        <div style="text-align: center; color: #9ca3af; font-size: 12px;">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    `;

    // For now, we'll use a simple console log. In production, you'd integrate with your email service
    console.log(`📧 Sending invitation email to ${email}:`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 Invite URL: ${inviteUrl}`);
    
    // Send the invitation email using the email service
    try {
      const result = await emailService.sendEmail({
        to: email,
        subject,
        content: htmlContent,
        fromName: "OutreachX Team",
        fromEmail: "noreply@outreachx.com"
      });
      
      if (result.success) {
        console.log(`✅ Invitation email sent successfully to ${email}`);
      } else {
        console.error(`❌ Failed to send invitation email to ${email}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error sending invitation email to ${email}:`, error);
    }
  }

  async validateInvitation(token: string): Promise<{ valid: boolean; invitation?: any; error?: string }> {
    try {
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return { valid: false, error: "Invalid invitation token" };
      }

      if (invitation.status !== 'pending') {
        return { valid: false, error: "This invitation has already been used" };
      }

      if (new Date() > invitation.expiresAt) {
        return { valid: false, error: "This invitation has expired" };
      }

      return { valid: true, invitation };
    } catch (error) {
      console.error('Error validating invitation:', error);
      return { valid: false, error: "Failed to validate invitation" };
    }
  }

  async acceptInvitation(token: string, userData: { username: string; password: string; firstName: string; lastName: string }): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const validation = await this.validateInvitation(token);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const invitation = validation.invitation!;

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return { success: false, error: "Username is already taken" };
      }

      // Create the user
      const user = await storage.createUser({
        username: userData.username,
        email: invitation.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: invitation.role as "head_admin" | "admin" | "founder" | "strategist" | "designer",
      });

      // Mark invitation as accepted
      await storage.markInvitationAsAccepted(token);

      return { success: true, user };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: "Failed to accept invitation" };
    }
  }
}

export const invitationService = new InvitationService();
