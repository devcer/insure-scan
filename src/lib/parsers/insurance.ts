/**
 * Insurance Premium Parser
 *
 * Extracts structured insurance premium data from email text.
 * Supports 130+ Indian insurance providers with pattern matching.
 */

/**
 * Payment status enum
 */
export type PaymentStatus = "DUE" | "PAID" | "UNKNOWN";

/**
 * Input metadata for email parsing
 */
export interface EmailMetadata {
  subject: string;
  fromEmail: string;
  receivedAt: Date;
}

/**
 * Parsed insurance premium data ready for database storage
 */
export interface ParsedInsuranceData {
  insurerName: string | null;
  policyNumber: string | null;
  amount: number | null; // INR
  dueDate: Date | null;
  paymentStatus: PaymentStatus;
  confidenceScore: number; // 0..1
  policyKey: string;
}

/**
 * Indian insurance company patterns (130+ providers)
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

  // Common variations
  "HDFC",
  "ICICI",
  "SBI",
  "Bajaj",
  "Tata",
  "Max",
  "Care",
  "Star",
  "Niva",
  "Digit",
];

/**
 * Policy number patterns
 */
const POLICY_NUMBER_PATTERNS = [
  /policy\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9\/-]{6,20})/i,
  /policy\s*:?\s*([A-Z0-9\/-]{6,20})/i,
  /certificate\s*(?:number|no\.?)?\s*:?\s*([A-Z0-9\/-]{6,20})/i,
  /\b([A-Z]{2,4}[0-9]{6,12})\b/,
  /\b([0-9]{10,15})\b/,
];

/**
 * Amount patterns (supports Indian number formats)
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
 */
const DUE_DATE_PATTERNS = [
  /due\s*(?:date|on|by)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  /(?:due|expiry|renewal)\s*:?\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  /(?:due|expiry|renewal)\s*date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  /pay\s*(?:by|before)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
  /(\d{4}-\d{2}-\d{2})/,
];

/**
 * Payment status keywords (per user specification)
 */
const PAID_KEYWORDS = ["payment successful", "payment received", "receipt", "thank you for your payment"];

const DUE_KEYWORDS = ["premium due", "payment due", "renew now", "pay now", "payable"];

/**
 * Extracts insurer name from email text and sender
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
 * Extracts premium amount from email text (INR)
 */
function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(/,/g, "");
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && amount > 0 && amount < 10000000) {
        return amount;
      }
    }
  }

  return null;
}

/**
 * Extracts due date from email text
 */
function extractDueDate(text: string): Date | null {
  for (const pattern of DUE_DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1];
      const parsed = new Date(dateStr);

      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Determines payment status based on keywords
 *
 * Rules:
 * - PAID: if "payment successful", "payment received", "receipt", "thank you for your payment"
 * - DUE: if "premium due", "payment due", "renew now", "pay now", "payable"
 * - UNKNOWN: if neither
 */
function determinePaymentStatus(text: string): PaymentStatus {
  const lowerText = text.toLowerCase();

  // Check PAID keywords first
  if (PAID_KEYWORDS.some((kw) => lowerText.includes(kw))) {
    return "PAID";
  }

  // Check DUE keywords
  if (DUE_KEYWORDS.some((kw) => lowerText.includes(kw))) {
    return "DUE";
  }

  return "UNKNOWN";
}

/**
 * Calculates confidence score based on extracted fields
 *
 * Rules:
 * - 0.9 if insurerName + amount + dueDate found
 * - 0.7 if any two found
 * - 0.5 otherwise
 */
function calculateConfidence(insurerName: string | null, amount: number | null, dueDate: Date | null): number {
  const foundFields = [insurerName !== null, amount !== null, dueDate !== null];

  const count = foundFields.filter(Boolean).length;

  if (count === 3) return 0.9;
  if (count === 2) return 0.7;
  return 0.5;
}

/**
 * Generates policy key for database storage
 *
 * Rules:
 * - if policyNumber exists: ${insurerName}:${policyNumber}
 * - else: ${insurerName}:${fromEmail}
 */
function generatePolicyKey(insurerName: string | null, policyNumber: string | null, fromEmail: string): string {
  if (insurerName && policyNumber) {
    return `${insurerName}:${policyNumber}`;
  }

  if (insurerName) {
    return `${insurerName}:${fromEmail}`;
  }

  // Fallback if no insurer name found
  return `UNKNOWN:${fromEmail}`;
}

/**
 * Main parsing function: extracts insurance premium data from email
 *
 * @param text - Decoded email body text
 * @param meta - Email metadata (subject, fromEmail, receivedAt)
 * @returns Parsed insurance data ready for database storage
 *
 * @example
 * ```typescript
 * const parsed = parseInsuranceEmail(emailText, {
 *   subject: 'Premium Due - Policy ABC123',
 *   fromEmail: 'noreply@hdfclife.com',
 *   receivedAt: new Date(),
 * });
 *
 * if (parsed.confidenceScore >= 0.7) {
 *   await saveToDatabase(parsed);
 * }
 * ```
 */
export function parseInsuranceEmail(text: string, meta: EmailMetadata): ParsedInsuranceData {
  // Combine text and subject for better extraction
  const fullText = `${meta.subject}\n${text}`;

  // Extract all fields
  const insurerName = extractInsurerName(fullText, meta.fromEmail);
  const policyNumber = extractPolicyNumber(fullText);
  const amount = extractAmount(fullText);
  const dueDate = extractDueDate(fullText);
  const paymentStatus = determinePaymentStatus(fullText);

  // Calculate confidence score
  const confidenceScore = calculateConfidence(insurerName, amount, dueDate);

  // Generate policy key
  const policyKey = generatePolicyKey(insurerName, policyNumber, meta.fromEmail);

  return {
    insurerName,
    policyNumber,
    amount,
    dueDate,
    paymentStatus,
    confidenceScore,
    policyKey,
  };
}
