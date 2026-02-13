import { NextResponse } from "next/server";
import { parseInsuranceEmailHybrid } from "@/lib/parsers/hybridParser";
import type { EmailMetadata } from "@/lib/gmail/decodeMessage";

/**
 * Test endpoint for hybrid parser
 * 
 * Usage:
 * POST http://localhost:3000/api/test-parser
 * 
 * Body: { "emailText": "...", "from": "...", "subject": "..." }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailText, from, subject } = body;

    if (!emailText) {
      return NextResponse.json(
        { error: "emailText is required" },
        { status: 400 }
      );
    }

    // Create metadata
    const metadata: EmailMetadata = {
      from: from || "test@starhealth.in",
      subject: subject || "Premium Payment Due",
      to: "customer@example.com",
      date: new Date().toISOString(),
      messageId: "test-" + Date.now(),
    };

    console.log("\n" + "=".repeat(80));
    console.log("TEST PARSER - Starting");
    console.log("=".repeat(80));

    // Parse with hybrid approach
    const result = await parseInsuranceEmailHybrid(emailText, metadata, {
      llmFallbackThreshold: 0.6,
      enableDebug: true,
      mergeStrategy: "highest_confidence",
    });

    console.log("=".repeat(80));
    console.log("TEST PARSER - Complete");
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      result: {
        insurerName: result.insurerName,
        policyNumber: result.policyNumber,
        amount: result.amount,
        currency: result.currency,
        dueDate: result.dueDate,
        paymentStatus: result.paymentStatus,
        policyType: result.policyType,
        premiumFrequency: result.premiumFrequency,
        confidenceScore: result.confidenceScore,
        fieldConfidence: result.fieldConfidence,
        extractedText: result.extractedText,
        errorCount: result.errors.length,
        errors: result.errors.map(e => ({
          type: e.type,
          field: e.field,
          message: e.message,
        })),
      },
    });
  } catch (error) {
    console.error("Test parser error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint with sample emails
 */
export async function GET() {
  const samples = [
    {
      name: "Well-formatted (Star Health)",
      emailText: `
Dear Customer,

Your premium payment for Star Health Insurance is due.

Policy Number: SH123456789
Premium Amount: ₹5,000.00
Due Date: 15/03/2024
Payment Status: Pending

Please pay before the due date to avoid policy lapse.

Thank you,
Star Health Insurance
      `,
      from: "noreply@starhealth.in",
      subject: "Premium Payment Due - Policy SH123456789",
    },
    {
      name: "Poorly formatted (needs LLM)",
      emailText: `
Hi there!

Just a quick reminder that your health insurance payment 
of five thousand rupees is coming up next month on the 
fifteenth of March.

Your policy ending in 0902 needs to be renewed.

Thanks!
      `,
      from: "reminders@insurance.com",
      subject: "Payment Reminder",
    },
    {
      name: "Complex format (HDFC ERGO)",
      emailText: `
HDFC ERGO Health Insurance

Policy Renewal Notice

Dear Valued Customer,

This is to inform you that your health insurance policy 
(Policy No: HDFC/HI/2024/789456) is due for renewal.

Premium Details:
- Base Premium: Rs. 12,500/-
- GST (18%): Rs. 2,250/-
- Total Payable: Rs. 14,750/-

Payment Due: 20th March 2024

Frequency: Annual

Please ensure timely payment to continue your coverage.

Regards,
HDFC ERGO Team
      `,
      from: "renewals@hdfcergo.com",
      subject: "Policy Renewal Notice - HDFC/HI/2024/789456",
    },
  ];

  return NextResponse.json({
    message: "Test parser endpoint",
    usage: {
      post: "POST /api/test-parser with { emailText, from, subject }",
      samples: "Use one of the sample emails below",
    },
    samples,
  });
}
