/**
 * LLM-Based Insurance Email Parser
 * 
 * Uses DeepSeek AI via LangChain to extract structured insurance data from unstructured email text.
 * Serves as a fallback for regex-based parsing when confidence is low.
 * 
 * DeepSeek is cost-effective and performs well on structured extraction tasks.
 */

import { ChatDeepSeek } from "@langchain/deepseek";
import type { EmailMetadata } from "@/lib/gmail/decodeMessage";
import type { ParsedInsuranceData } from "./insurance";

/**
 * Structured output from LLM
 */
interface LLMExtractionResult {
  insurerName: string | null;
  policyNumber: string | null;
  amount: number | null;
  currency: string;
  dueDate: string | null; // ISO format
  paymentStatus: "paid" | "pending" | "overdue" | "cancelled";
  policyType: string | null;
  premiumFrequency: "monthly" | "quarterly" | "halfyearly" | "annual";
  confidence: number; // 0-1
  reasoning?: string; // Optional explanation
}

/**
 * Build the extraction prompt for DeepSeek
 */
function buildExtractionPrompt(emailText: string, metadata: EmailMetadata): string {
  return `You are an expert at extracting structured insurance premium information from emails.

Extract the following information from this insurance email:

**Required Fields:**
1. **Insurer Name**: The insurance company name (e.g., "Star Health Insurance", "HDFC ERGO", "LIC")
2. **Policy Number**: The policy/certificate number (alphanumeric, 6-20 characters)
3. **Premium Amount**: The premium amount as a number only (no currency symbols)
4. **Currency**: The currency code (INR, USD, EUR, GBP, etc.)
5. **Due Date**: The payment due date in ISO format (YYYY-MM-DD)
6. **Payment Status**: One of: paid, pending, overdue, cancelled
7. **Policy Type**: One of: health, life, motor, home, travel, other
8. **Premium Frequency**: One of: monthly, quarterly, halfyearly, annual

**Email Metadata:**
- From: ${metadata.from}
- Subject: ${metadata.subject}
- Date: ${metadata.date}

**Email Content:**
${emailText.slice(0, 4000)}${emailText.length > 4000 ? '\n...[truncated]' : ''}

**Instructions:**
- Extract only factual information present in the email
- If a field cannot be determined, return null
- For amounts, extract only the number (e.g., 5000.50, not "₹5,000.50")
- For dates, convert to ISO format YYYY-MM-DD
- Infer payment status from keywords like "paid", "due", "pending", "overdue"
- Infer policy type from keywords like "health", "life", "motor", "vehicle", "car"
- Infer frequency from keywords like "monthly", "quarterly", "annual", "yearly"
- Provide a confidence score (0-1) based on how clear the information is
- Default currency to INR if not specified

**Response Format (JSON only, no markdown):**
{
  "insurerName": "string or null",
  "policyNumber": "string or null",
  "amount": number or null,
  "currency": "string",
  "dueDate": "YYYY-MM-DD or null",
  "paymentStatus": "paid|pending|overdue|cancelled",
  "policyType": "health|life|motor|home|travel|other or null",
  "premiumFrequency": "monthly|quarterly|halfyearly|annual",
  "confidence": 0.95,
  "reasoning": "Brief explanation of extraction confidence"
}`;
}

/**
 * Parse JSON response from LLM, handling markdown code blocks
 */
function parseJSONResponse(content: string): LLMExtractionResult {
  // Remove markdown code blocks if present
  let jsonStr = content.trim();
  
  // Remove ```json and ``` markers
  jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  
  // Find JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in LLM response");
  }

  return JSON.parse(jsonMatch[0]) as LLMExtractionResult;
}

/**
 * Main LLM extraction function using DeepSeek
 * 
 * @param emailText - Decoded email body text
 * @param metadata - Email metadata (from, subject, date)
 * @returns Parsed insurance data with high confidence
 */
export async function extractWithLLM(
  emailText: string,
  metadata: EmailMetadata
): Promise<Partial<ParsedInsuranceData>> {
  try {
    console.log("[LLM] Starting extraction with DeepSeek...");
    const startTime = Date.now();

    // Get API key from environment
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.warn("[LLM] DEEPSEEK_API_KEY not configured, skipping LLM extraction");
      return createEmptyResult();
    }

    // Initialize DeepSeek model
    const model = new ChatDeepSeek({
      apiKey,
      model: "deepseek-chat", // Cost-effective model
      temperature: 0.1, // Low temperature for consistent extraction
      maxTokens: 1000,
    });

    // Build prompt
    const prompt = buildExtractionPrompt(emailText, metadata);

    // Call DeepSeek
    const response = await model.invoke([
      {
        role: "system",
        content: "You are an expert at extracting structured data from insurance emails. Always respond with valid JSON only, no markdown formatting.",
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    const content = response.content;
    if (typeof content !== "string") {
      throw new Error("Unexpected response format from DeepSeek");
    }

    // Parse JSON response
    const result = parseJSONResponse(content);

    const processingTime = Date.now() - startTime;
    console.log(`[LLM] ✅ Extraction complete in ${processingTime}ms`);
    console.log(`[LLM] Confidence: ${result.confidence}`);
    console.log(`[LLM] Reasoning: ${result.reasoning}`);
    console.log(`[LLM] Extracted:`, {
      insurer: result.insurerName,
      policy: result.policyNumber,
      amount: result.amount,
      dueDate: result.dueDate,
    });

    // Convert LLM result to ParsedInsuranceData format
    const parsedData: Partial<ParsedInsuranceData> = {
      insurerName: result.insurerName,
      policyNumber: result.policyNumber,
      amount: result.amount,
      currency: result.currency || "INR",
      dueDate: result.dueDate ? new Date(result.dueDate) : null,
      paymentStatus: result.paymentStatus,
      policyType: result.policyType,
      premiumFrequency: result.premiumFrequency,
      confidenceScore: result.confidence,
      fieldConfidence: {
        insurerName: result.insurerName ? result.confidence : 0,
        policyNumber: result.policyNumber ? result.confidence : 0,
        amount: result.amount ? result.confidence : 0,
        dueDate: result.dueDate ? result.confidence : 0,
        overall: result.confidence,
      },
      extractedText: {
        insurerMatch: result.insurerName || undefined,
        policyMatch: result.policyNumber || undefined,
        amountMatch: result.amount?.toString() || undefined,
        dueDateMatch: result.dueDate || undefined,
      },
      errors: [], // LLM extraction doesn't produce structured errors
    };

    return parsedData;
  } catch (error) {
    console.error("[LLM] Extraction failed:", error);
    return createEmptyResult();
  }
}

/**
 * Create an empty result for error cases
 */
function createEmptyResult(): Partial<ParsedInsuranceData> {
  return {
    insurerName: null,
    policyNumber: null,
    amount: null,
    currency: "INR",
    dueDate: null,
    paymentStatus: "pending",
    policyType: null,
    premiumFrequency: "annual",
    confidenceScore: 0,
    fieldConfidence: {
      insurerName: 0,
      policyNumber: 0,
      amount: 0,
      dueDate: 0,
      overall: 0,
    },
    extractedText: {},
    errors: [],
  };
}

/**
 * Check if LLM extraction is available
 */
export function isLLMAvailable(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}
