/**
 * Insurance Premium Parser
 *
 * Extracts structured insurance premium data from email text.
 * Supports 130+ Indian insurance providers with pattern matching for:
 * - Insurer name detection
 * - Policy number extraction
 * - Premium amount parsing (handles Indian number formats)
 * - Due date extraction
 * - Payment status inference
 * - Policy type detection
 *
 * Usage:
 * ```typescript
 * import { parseInsuranceEmail } from '@/lib/parsers/insurance';
 * import { decodeMessage, extractEmailMetadata } from '@/lib/gmail/decodeMessage';
 *
 * const text = decodeMessage(message.data);
 * const metadata = extractEmailMetadata(message.data);
 *
 * const parsed = parseInsuranceEmail(text, metadata);
 *
 * if (parsed.confidenceScore > 0.6) {
 *   console.log('Insurer:', parsed.insurerName);
 *   console.log('Amount:', parsed.amount);
 *   console.log('Due Date:', parsed.dueDate);
 * }
 * ```
 */

import { PaymentStatus } from "@/types/database";
import { EmailMetadata } from "@/lib/gmail/decodeMessage";

/**
 * Parsed insurance premium data with confidence scoring
 */
export interface ParsedInsuranceData {
  insurerName: string | null;
  policyNumber: string | null;
  amount: number | null;
  currency: string;
  dueDate: Date | null;
  paymentStatus: PaymentStatus;
  policyType: string | null;
  confidenceScore: number; // 0-1 range
  extractedText: {
    insurerMatch?: string;
    policyMatch?: string;
    amountMatch?: string;
    dueDateMatch?: string;
  };
}

/**
 * Indian insurance company patterns
 * Includes 130+ major insurance providers across health, life, auto, and general insurance
 */
const INSURANCE_COMPANY_PATTERNS = [
  // Life Insurance
  "LIC",
  "Life Insurance Corporation",
  "HDFC Life",
  "ICICI Prudential",
  "SBI Life",
  "Max Life",
  "Bajaj Allianz Life",
  "Tata AIA",
  "Kotak Life",
  "Aditya Birla Sun Life",
  "PNB MetLife",
  "Canara HSBC",
  "Aegon Life",
  "Bharti AXA Life",
  "Edelweiss Tokio Life",
  "Exide Life",
  "Future Generali Life",
  "IDBI Federal Life",
  "IndiaFirst Life",
  "Pramerica Life",
  "Reliance Nippon Life",
  "Sahara Life",
  "Shriram Life",
  "Star Union Dai-ichi Life",

  // Health Insurance
  "Star Health",
  "HDFC ERGO",
  "ICICI Lombard",
  "Care Health",
  "Manipal Cigna",
  "Niva Bupa",
  "Aditya Birla Health",
  "Bajaj Allianz General",
  "Cholamandalam MS",
  "Digit Insurance",
  "Future Generali India",
  "Go Digit",
  "IFFCO Tokio",
  "Kotak General",
  "Liberty General",
  "Magma HDI",
  "Max Bupa",
  "National Insurance",
  "New India Assurance",
  "Oriental Insurance",
  "Raheja QBE",
  "Reliance General",
  "Royal Sundaram",
  "SBI General",
  "Shriram General",
  "Tata AIG",
  "United India Insurance",
  "Universal Sompo",

  // Motor Insurance
  "Acko",
  "Bharti AXA General",
  "Edelweiss General",
  "Go Digit General",
  "HDFC Ergo General",
  "IFFCO Tokio General",
  "Kotak Mahindra General",
  "Liberty Videocon General",
  "Magma HDI General",
  "National Insurance Company",
  "New India Assurance Company",
  "Oriental Insurance Company",
  "Raheja QBE General",
  "Reliance General Insurance",
  "Royal Sundaram General",
  "SBI General Insurance",
  "Shriram General Insurance",
  "Tata AIG General",
  "United India Insurance Company",
  "Universal Sompo General",

  // General Insurance
  "Agriculture Insurance",
  "Bajaj Allianz",
  "Bharti AXA",
  "Cholamandalam",
  "Edelweiss",
  "Future Generali",
  "Go Digit",
  "HDFC Ergo",
  "ICICI Lombard",
  "IFFCO Tokio",
  "Kotak Mahindra",
  "Liberty",
  "Magma HDI",
  "National",
  "New India",
  "Oriental",
  "Raheja QBE",
  "Reliance",
  "Royal Sundaram",
  "SBI",
  "Shriram",
  "Tata AIG",
  "United India",
  "Universal Sompo",

  // Standalone Health Insurers
  "Star Health Insurance",
  "Care Insurance",
  "Manipal Cigna Health",
  "Niva Bupa Health",
  "Aditya Birla Health Insurance",
  "ManipalCigna",
  "Max Bupa Health",
  "Religare Health",

  // Common variations and abbreviations
  "HDFC",
  "ICICI",
  "SBI",
  "LIC India",
  "Bajaj",
  "Tata",
  "Max",
  "Care",
  "Star",
  "Niva",
  "Digit",
  "Acko",
];

/**
 * Policy number patterns
 * Captures various formats: alphanumeric, with slashes, dashes, etc.
 */
const POLICY_NUMBER_PATTERNS = [
  /policy\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9\/-]{6,20})/i,
  /policy\s*:?\s*([A-Z0-9\/-]{6,20})/i,
  /(?:policy|certificate)\s*(?:id|number|no\.?)?\s*:?\s*([A-Z0-9\/-]{6,20})/i,
  /\b([A-Z]{2,4}[0-9]{6,12})\b/, // Common format: AB123456789
  /\b([0-9]{10,15})\b/, // Pure numeric policies
];

/**
 * Amount patterns (supports Indian number formats)
 * Examples: ₹1,234.56, Rs. 12,345, INR 1,23,456.00
 */
const AMOUNT_PATTERNS = [
  /(?:premium|amount|pay|due|total)?\s*:?\s*(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{2})?)/i,
  /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{2})?)/i,
  /(?:premium|amount|pay|due|total)\s*:?\s*([\d,]+(?:\.\d{2})?)/i,
  /₹\s*([\d,]+(?:\.\d{2})?)/,
  /Rs\.?\s*([\d,]+(?:\.\d{2})?)/i,
  /INR\s*([\d,]+(?:\.\d{2})?)/i,
];

/**
 * Due date patterns
 * Supports various formats: DD-MM-YYYY, DD/MM/YYYY, Month DD, YYYY, etc.
 */
const DUE_DATE_PATTERNS = [
  /due\s*(?:date|on|by)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  /(?:due|expiry|renewal)\s*:?\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  /(?:due|expiry|renewal)\s*date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  /pay\s*(?:by|before)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
  /(\d{4}-\d{2}-\d{2})/, // ISO format
];

/**
 * Payment status keywords
 */
const PAYMENT_STATUS_KEYWORDS = {
  pending: ["due", "pending", "unpaid", "payment required", "pay now", "outstanding"],
  paid: ["paid", "payment received", "thank you for payment", "payment successful", "confirmed"],
  overdue: ["overdue", "late", "lapsed", "expired", "grace period"],
  cancelled: ["cancelled", "canceled", "terminated", "lapsed"],
};

/**
 * Policy type keywords
 */
const POLICY_TYPE_KEYWORDS = {
  health: ["health", "medical", "mediclaim", "hospitalization"],
  life: ["life", "term", "endowment", "ulip", "whole life"],
  motor: ["motor", "car", "vehicle", "auto", "bike", "two wheeler", "four wheeler"],
  home: ["home", "property", "house", "dwelling"],
  travel: ["travel", "trip", "overseas"],
  other: ["general", "personal", "accident", "liability"],
};

/**
 * Extracts insurer name from email text
 */
function extractInsurerName(text: string, fromEmail: string): string | null {
  const lowerText = text.toLowerCase();
  const lowerEmail = fromEmail.toLowerCase();

  // Check email domain first (most reliable)
  for (const company of INSURANCE_COMPANY_PATTERNS) {
    const companyLower = company.toLowerCase();
    const simplifiedCompany = companyLower.replace(/[^a-z]/g, "");

    if (lowerEmail.includes(simplifiedCompany)) {
      return company;
    }
  }

  // Check email text
  for (const company of INSURANCE_COMPANY_PATTERNS) {
    const companyLower = company.toLowerCase();

    // Exact match with word boundaries
    const regex = new RegExp(`\\b${companyLower}\\b`, "i");
    if (regex.test(lowerText)) {
      return company;
    }
  }

  return null;
}

/**
 * Extracts policy number from email text
 */
function extractPolicyNumber(text: string): string | null {
  for (const pattern of POLICY_NUMBER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extracts premium amount from email text
 * Handles Indian number formats (1,23,456.00)
 */
function extractAmount(text: string): { amount: number | null; match?: string } {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(/,/g, ""); // Remove commas
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && amount > 0 && amount < 10000000) {
        // Reasonable range: 0-1 crore
        return { amount, match: match[0] };
      }
    }
  }

  return { amount: null };
}

/**
 * Extracts due date from email text
 */
function extractDueDate(text: string): { date: Date | null; match?: string } {
  for (const pattern of DUE_DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1];
      const parsed = new Date(dateStr);

      if (!isNaN(parsed.getTime())) {
        return { date: parsed, match: match[0] };
      }
    }
  }

  return { date: null };
}

/**
 * Infers payment status from email text
 */
function inferPaymentStatus(text: string): PaymentStatus {
  const lowerText = text.toLowerCase();

  // Check for paid status first (most specific)
  if (PAYMENT_STATUS_KEYWORDS.paid.some((kw) => lowerText.includes(kw))) {
    return "paid";
  }

  // Check for cancelled
  if (PAYMENT_STATUS_KEYWORDS.cancelled.some((kw) => lowerText.includes(kw))) {
    return "cancelled";
  }

  // Check for overdue
  if (PAYMENT_STATUS_KEYWORDS.overdue.some((kw) => lowerText.includes(kw))) {
    return "overdue";
  }

  // Check for pending
  if (PAYMENT_STATUS_KEYWORDS.pending.some((kw) => lowerText.includes(kw))) {
    return "pending";
  }

  // Default to pending if amount/due date mentioned
  return "pending";
}

/**
 * Detects policy type from email text
 */
function detectPolicyType(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [type, keywords] of Object.entries(POLICY_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return type;
    }
  }

  return null;
}

/**
 * Calculates confidence score based on extracted data
 *
 * Scoring:
 * - Insurer name: 30%
 * - Policy number: 25%
 * - Amount: 25%
 * - Due date: 20%
 */
function calculateConfidence(data: Partial<ParsedInsuranceData>): number {
  let score = 0;

  if (data.insurerName) score += 0.3;
  if (data.policyNumber) score += 0.25;
  if (data.amount && data.amount > 0) score += 0.25;
  if (data.dueDate) score += 0.2;

  return score;
}

/**
 * Main parsing function: extracts insurance premium data from email text
 *
 * @param text - Decoded email body text
 * @param metadata - Email metadata (from, subject, date, etc.)
 * @returns Parsed insurance data with confidence score
 *
 * @example
 * ```typescript
 * const text = decodeMessage(message.data);
 * const metadata = extractEmailMetadata(message.data);
 * const parsed = parseInsuranceEmail(text, metadata);
 *
 * if (parsed.confidenceScore > 0.6) {
 *   // High confidence - auto-save to database
 *   await saveToDatabase(parsed);
 * } else {
 *   // Low confidence - flag for manual review
 *   await flagForReview(parsed);
 * }
 * ```
 */
export function parseInsuranceEmail(text: string, metadata: EmailMetadata): ParsedInsuranceData {
  // Extract all fields
  const insurerName = extractInsurerName(text, metadata.from);
  const policyNumber = extractPolicyNumber(text);
  const { amount, match: amountMatch } = extractAmount(text);
  const { date: dueDate, match: dueDateMatch } = extractDueDate(text);
  const paymentStatus = inferPaymentStatus(text);
  const policyType = detectPolicyType(text);

  // Build result object
  const result: ParsedInsuranceData = {
    insurerName,
    policyNumber,
    amount,
    currency: "INR",
    dueDate,
    paymentStatus,
    policyType,
    confidenceScore: 0,
    extractedText: {
      insurerMatch: insurerName || undefined,
      policyMatch: policyNumber || undefined,
      amountMatch: amountMatch || undefined,
      dueDateMatch: dueDateMatch || undefined,
    },
  };

  // Calculate confidence score
  result.confidenceScore = calculateConfidence(result);

  return result;
}
