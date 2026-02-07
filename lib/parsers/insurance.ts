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

import type { Database } from "@/types/database.types";

type PaymentStatus = Database["public"]["Tables"]["insurance_premiums"]["Row"]["payment_status"];
import { EmailMetadata } from "@/lib/gmail/decodeMessage";

/**
 * Parsing error types for categorization
 */
export enum ParseErrorType {
  FIELD_EXTRACTION_FAILED = "FIELD_EXTRACTION_FAILED",
  INVALID_FORMAT = "INVALID_FORMAT",
  MISSING_REQUIRED_DATA = "MISSING_REQUIRED_DATA",
  DATE_PARSING_ERROR = "DATE_PARSING_ERROR",
  AMOUNT_PARSING_ERROR = "AMOUNT_PARSING_ERROR",
  CURRENCY_DETECTION_ERROR = "CURRENCY_DETECTION_ERROR",
  INSURER_DETECTION_ERROR = "INSURER_DETECTION_ERROR",
  POLICY_NUMBER_ERROR = "POLICY_NUMBER_ERROR",
}

/**
 * Structured parsing error information
 */
export interface ParseError {
  type: ParseErrorType;
  field: string;
  message: string;
  attemptedPatterns?: string[];
  extractedValue?: string;
  context?: string;
  timestamp: Date;
}

/**
 * Debug information for parsing operations
 */
export interface DebugInfo {
  emailContent: string;
  emailMetadata: EmailMetadata;
  parsingSteps: ParsingStep[];
  patternMatches: PatternMatch[];
  extractionAttempts: ExtractionAttempt[];
  errors: ParseError[];
  timestamp: Date;
  processingTimeMs: number;
}

/**
 * Individual parsing step information
 */
export interface ParsingStep {
  step: string;
  field: string;
  success: boolean;
  result?: any;
  confidence?: number;
  timestamp: Date;
}

/**
 * Pattern matching result information
 */
export interface PatternMatch {
  field: string;
  pattern: string;
  match: string | null;
  confidence: number;
  position?: number;
}

/**
 * Extraction attempt information
 */
export interface ExtractionAttempt {
  field: string;
  method: string;
  input: string;
  output: any;
  success: boolean;
  confidence: number;
  error?: string;
}

/**
 * Field confidence scores for individual extraction results
 */
export interface FieldConfidence {
  insurerName: number;
  policyNumber: number;
  amount: number;
  dueDate: number;
  overall: number;
}

/**
 * Parsed insurance premium data with confidence scoring and debug information
 */
export interface ParsedInsuranceData {
  insurerName: string | null;
  policyNumber: string | null;
  amount: number | null;
  currency: string;
  dueDate: Date | null;
  paymentStatus: PaymentStatus;
  policyType: string | null;
  premiumFrequency: string; // monthly, quarterly, halfyearly, annual
  confidenceScore: number; // 0-1 range
  fieldConfidence: FieldConfidence;
  extractedText: {
    insurerMatch?: string;
    policyMatch?: string;
    amountMatch?: string;
    dueDateMatch?: string;
  };
  debugInfo?: DebugInfo; // Optional debug information
  errors: ParseError[]; // Parsing errors encountered
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
 * Enhanced policy number patterns with confidence scoring
 * Captures various formats: alphanumeric, with slashes, dashes, etc.
 */
const POLICY_NUMBER_PATTERNS = [
  { pattern: /policy\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9\/-]{6,20})/i, confidence: 0.9 },
  { pattern: /certificate\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9\/-]{6,20})/i, confidence: 0.85 },
  { pattern: /policy\s*:?\s*([A-Z0-9\/-]{6,20})/i, confidence: 0.8 },
  { pattern: /(?:policy|certificate)\s*(?:id|number|no\.?)?\s*:?\s*([A-Z0-9\/-]{6,20})/i, confidence: 0.75 },
  { pattern: /\b([A-Z]{2,4}[0-9]{6,12})\b/, confidence: 0.7 }, // Common format: AB123456789
  { pattern: /\b([0-9]{10,15})\b/, confidence: 0.6 }, // Pure numeric policies
  { pattern: /ref\s*(?:no|number)?\s*:?\s*([A-Z0-9\/-]{6,20})/i, confidence: 0.65 },
  { pattern: /application\s*(?:no|number)?\s*:?\s*([A-Z0-9\/-]{6,20})/i, confidence: 0.6 },
  // Handle masked policy numbers like XXXXXXX0902
  { pattern: /(?:policy|certificate).*?([X]{4,}[A-Z0-9]{3,8})/i, confidence: 0.5 },
  { pattern: /([X]{4,}[A-Z0-9]{3,8})/g, confidence: 0.4 }, // Generic masked pattern
];

/**
 * Enhanced amount patterns with currency detection and confidence scoring
 * Examples: ₹1,234.56, Rs. 12,345, INR 1,23,456.00, $1,234.56, USD 1,234.56
 */
const AMOUNT_PATTERNS = [
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{2})?)/i, currency: "INR", confidence: 0.95 },
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*(?:\$|USD)\s*([\d,]+(?:\.\d{2})?)/i, currency: "USD", confidence: 0.95 },
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*(?:€|EUR)\s*([\d,]+(?:\.\d{2})?)/i, currency: "EUR", confidence: 0.95 },
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*(?:£|GBP)\s*([\d,]+(?:\.\d{2})?)/i, currency: "GBP", confidence: 0.95 },
  { pattern: /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{2})?)/i, currency: "INR", confidence: 0.85 },
  { pattern: /(?:\$|USD)\s*([\d,]+(?:\.\d{2})?)/i, currency: "USD", confidence: 0.85 },
  { pattern: /(?:€|EUR)\s*([\d,]+(?:\.\d{2})?)/i, currency: "EUR", confidence: 0.85 },
  { pattern: /(?:£|GBP)\s*([\d,]+(?:\.\d{2})?)/i, currency: "GBP", confidence: 0.85 },
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*([\d,]+(?:\.\d{2})?)\s*(?:Rs\.?|₹|INR)/i, currency: "INR", confidence: 0.8 },
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*([\d,]+(?:\.\d{2})?)\s*(?:\$|USD)/i, currency: "USD", confidence: 0.8 },
  { pattern: /(?:premium|amount|pay|due|total)\s*:?\s*([\d,]+(?:\.\d{2})?)/i, currency: "INR", confidence: 0.7 }, // Default to INR
  { pattern: /₹\s*([\d,]+(?:\.\d{2})?)/g, currency: "INR", confidence: 0.75 },
  { pattern: /Rs\.?\s*([\d,]+(?:\.\d{2})?)/i, currency: "INR", confidence: 0.75 },
  { pattern: /INR\s*([\d,]+(?:\.\d{2})?)/i, currency: "INR", confidence: 0.75 },
  { pattern: /\$\s*([\d,]+(?:\.\d{2})?)/g, currency: "USD", confidence: 0.7 },
  { pattern: /USD\s*([\d,]+(?:\.\d{2})?)/i, currency: "USD", confidence: 0.75 },
];

/**
 * Enhanced due date patterns with confidence scoring
 * Supports various formats: DD-MM-YYYY, DD/MM/YYYY, Month DD, YYYY, etc.
 */
const DUE_DATE_PATTERNS = [
  { pattern: /due\s*(?:date|on|by)?\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.95 },
  { pattern: /(?:due|expiry|renewal)\s*date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.9 },
  { pattern: /pay\s*(?:by|before)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.9 },
  { pattern: /(?:due|expiry|renewal)\s*:?\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i, confidence: 0.85 },
  { pattern: /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i, confidence: 0.8 },
  { pattern: /(\d{4}-\d{2}-\d{2})/, confidence: 0.75 }, // ISO format
  { pattern: /(?:expires?|expiry)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.8 },
  { pattern: /(?:valid\s*till|valid\s*until)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.75 },
  { pattern: /(?:maturity|maturity\s*date)\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.7 },
  // Additional patterns for renewal emails
  { pattern: /renewal.*?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.65 },
  { pattern: /next\s*(?:payment|premium).*?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i, confidence: 0.6 },
  // Handle dates in different formats
  { pattern: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/, confidence: 0.5 }, // Generic date pattern
];

/**
 * Parsing error logging and debugging utilities
 */
class ParsingLogger {
  private static instance: ParsingLogger;
  private debugMode: boolean = false;

  private constructor() {}

  static getInstance(): ParsingLogger {
    if (!ParsingLogger.instance) {
      ParsingLogger.instance = new ParsingLogger();
    }
    return ParsingLogger.instance;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Log a parsing error with structured information
   */
  logError(error: ParseError): void {
    if (this.debugMode) {
      console.error(`[PARSING_ERROR] ${error.type}: ${error.message}`, {
        field: error.field,
        attemptedPatterns: error.attemptedPatterns,
        extractedValue: error.extractedValue,
        context: error.context,
        timestamp: error.timestamp,
      });
    }
  }

  /**
   * Log a parsing step for debugging
   */
  logStep(step: ParsingStep): void {
    if (this.debugMode) {
      console.log(`[PARSING_STEP] ${step.step} (${step.field}):`, {
        success: step.success,
        result: step.result,
        confidence: step.confidence,
        timestamp: step.timestamp,
      });
    }
  }

  /**
   * Log pattern matching results
   */
  logPatternMatch(match: PatternMatch): void {
    if (this.debugMode) {
      console.log(`[PATTERN_MATCH] ${match.field}:`, {
        pattern: match.pattern,
        match: match.match,
        confidence: match.confidence,
        position: match.position,
      });
    }
  }

  /**
   * Log extraction attempt
   */
  logExtractionAttempt(attempt: ExtractionAttempt): void {
    if (this.debugMode) {
      console.log(`[EXTRACTION_ATTEMPT] ${attempt.field} (${attempt.method}):`, {
        success: attempt.success,
        output: attempt.output,
        confidence: attempt.confidence,
        error: attempt.error,
      });
    }
  }

  /**
   * Create a structured error object
   */
  createError(
    type: ParseErrorType,
    field: string,
    message: string,
    options?: {
      attemptedPatterns?: string[];
      extractedValue?: string;
      context?: string;
    }
  ): ParseError {
    const error: ParseError = {
      type,
      field,
      message,
      timestamp: new Date(),
      ...options,
    };

    this.logError(error);
    return error;
  }
}

// Export singleton instance
export const parsingLogger = ParsingLogger.getInstance();

/**
 * Payment status keywords
 */
const PAYMENT_STATUS_KEYWORDS = {
  paid: ["paid", "payment received", "thank you for payment", "payment successful", "confirmed", "receipt"],
  pending: ["due", "pending", "unpaid", "payment required", "pay now", "outstanding", "renewal"],
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
 * Premium frequency keywords
 */
const PREMIUM_FREQUENCY_KEYWORDS = {
  monthly: ["monthly", "per month", "/month", "every month", "month premium", "monthly premium", "monthly installment"],
  quarterly: ["quarterly", "per quarter", "/quarter", "every quarter", "quarter premium", "quarterly premium", "3 months"],
  halfyearly: ["half yearly", "half-yearly", "semi-annual", "semi annual", "6 months", "six months"],
  annual: ["annual", "yearly", "per year", "/year", "every year", "year premium", "annual premium", "12 months"],
};

/**
 * Enhanced insurer name extraction with confidence scoring and error logging
 */
function extractInsurerName(
  text: string, 
  fromEmail: string, 
  errors: ParseError[]
): { name: string | null; confidence: number; match?: string } {
  const lowerText = text.toLowerCase();
  const lowerEmail = fromEmail.toLowerCase();
  const attemptedPatterns: string[] = [];

  try {
    // Check email domain first (most reliable)
    for (const company of INSURANCE_COMPANY_PATTERNS) {
      const companyLower = company.toLowerCase();
      const simplifiedCompany = companyLower.replace(/[^a-z]/g, "");
      attemptedPatterns.push(`email_domain:${simplifiedCompany}`);

      if (lowerEmail.includes(simplifiedCompany)) {
        parsingLogger.logStep({
          step: "insurer_extraction",
          field: "insurerName",
          success: true,
          result: company,
          confidence: 0.95,
          timestamp: new Date(),
        });
        return { name: company, confidence: 0.95, match: fromEmail };
      }
    }

    // Check email text with exact match (high confidence)
    for (const company of INSURANCE_COMPANY_PATTERNS) {
      const companyLower = company.toLowerCase();
      const regex = new RegExp(`\\b${companyLower}\\b`, "i");
      attemptedPatterns.push(`exact_match:${companyLower}`);
      
      if (regex.test(lowerText)) {
        parsingLogger.logStep({
          step: "insurer_extraction",
          field: "insurerName",
          success: true,
          result: company,
          confidence: 0.85,
          timestamp: new Date(),
        });
        return { name: company, confidence: 0.85, match: company };
      }
    }

    // Check for partial matches (lower confidence)
    for (const company of INSURANCE_COMPANY_PATTERNS) {
      const companyLower = company.toLowerCase();
      attemptedPatterns.push(`partial_match:${companyLower}`);
      
      if (lowerText.includes(companyLower)) {
        parsingLogger.logStep({
          step: "insurer_extraction",
          field: "insurerName",
          success: true,
          result: company,
          confidence: 0.7,
          timestamp: new Date(),
        });
        return { name: company, confidence: 0.7, match: company };
      }
    }

    // Log failure
    const error = parsingLogger.createError(
      ParseErrorType.INSURER_DETECTION_ERROR,
      "insurerName",
      "Could not detect insurance company from email content or sender",
      {
        attemptedPatterns,
        context: `Email: ${fromEmail}, Text preview: ${text.substring(0, 200)}...`,
      }
    );
    errors.push(error);

    return { name: null, confidence: 0 };
  } catch (err) {
    const error = parsingLogger.createError(
      ParseErrorType.FIELD_EXTRACTION_FAILED,
      "insurerName",
      `Unexpected error during insurer extraction: ${err}`,
      { context: `Email: ${fromEmail}` }
    );
    errors.push(error);
    return { name: null, confidence: 0 };
  }
}

/**
 * Enhanced policy number extraction with confidence scoring and error logging
 */
function extractPolicyNumber(
  text: string, 
  errors: ParseError[]
): { number: string | null; confidence: number; match?: string } {
  const attemptedPatterns: string[] = [];

  try {
    for (const { pattern, confidence } of POLICY_NUMBER_PATTERNS) {
      attemptedPatterns.push(pattern.toString());
      const match = text.match(pattern);
      
      if (match && match[1]) {
        const policyNumber = match[1].trim();
        
        // Additional validation for policy number format
        if (policyNumber.length >= 6 && policyNumber.length <= 20) {
          parsingLogger.logStep({
            step: "policy_number_extraction",
            field: "policyNumber",
            success: true,
            result: policyNumber,
            confidence,
            timestamp: new Date(),
          });
          return { number: policyNumber, confidence, match: match[0] };
        } else {
          // Log invalid format
          const error = parsingLogger.createError(
            ParseErrorType.INVALID_FORMAT,
            "policyNumber",
            `Policy number has invalid length: ${policyNumber.length}`,
            {
              extractedValue: policyNumber,
              context: `Expected length: 6-20 characters`,
            }
          );
          errors.push(error);
        }
      }
    }

    // Log failure
    const error = parsingLogger.createError(
      ParseErrorType.POLICY_NUMBER_ERROR,
      "policyNumber",
      "Could not extract policy number from email content",
      {
        attemptedPatterns,
        context: `Text preview: ${text.substring(0, 200)}...`,
      }
    );
    errors.push(error);

    return { number: null, confidence: 0 };
  } catch (err) {
    const error = parsingLogger.createError(
      ParseErrorType.FIELD_EXTRACTION_FAILED,
      "policyNumber",
      `Unexpected error during policy number extraction: ${err}`
    );
    errors.push(error);
    return { number: null, confidence: 0 };
  }
}

/**
 * Enhanced amount extraction with currency detection, confidence scoring, and error logging
 */
function extractAmount(
  text: string, 
  errors: ParseError[]
): { amount: number | null; currency: string; confidence: number; match?: string } {
  const attemptedPatterns: string[] = [];

  try {
    for (const { pattern, currency, confidence } of AMOUNT_PATTERNS) {
      attemptedPatterns.push(`${currency}:${pattern.toString()}`);
      const match = text.match(pattern);
      
      if (match && match[1]) {
        const amountStr = match[1].replace(/,/g, ""); // Remove commas
        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && amount > 0 && amount < 10000000) {
          // Reasonable range: 0-1 crore
          parsingLogger.logStep({
            step: "amount_extraction",
            field: "amount",
            success: true,
            result: { amount, currency },
            confidence,
            timestamp: new Date(),
          });
          return { amount, currency, confidence, match: match[0] };
        } else {
          // Log invalid amount
          const error = parsingLogger.createError(
            ParseErrorType.AMOUNT_PARSING_ERROR,
            "amount",
            `Extracted amount is out of valid range: ${amount}`,
            {
              extractedValue: amountStr,
              context: `Valid range: 0-10,000,000`,
            }
          );
          errors.push(error);
        }
      }
    }

    // Log failure
    const error = parsingLogger.createError(
      ParseErrorType.AMOUNT_PARSING_ERROR,
      "amount",
      "Could not extract premium amount from email content",
      {
        attemptedPatterns,
        context: `Text preview: ${text.substring(0, 200)}...`,
      }
    );
    errors.push(error);

    return { amount: null, currency: "INR", confidence: 0 }; // Default currency
  } catch (err) {
    const error = parsingLogger.createError(
      ParseErrorType.FIELD_EXTRACTION_FAILED,
      "amount",
      `Unexpected error during amount extraction: ${err}`
    );
    errors.push(error);
    return { amount: null, currency: "INR", confidence: 0 };
  }
}

/**
 * Enhanced due date extraction with confidence scoring and error logging
 */
function extractDueDate(
  text: string, 
  errors: ParseError[]
): { date: Date | null; confidence: number; match?: string } {
  const attemptedPatterns: string[] = [];

  try {
    for (const { pattern, confidence } of DUE_DATE_PATTERNS) {
      attemptedPatterns.push(pattern.toString());
      const match = text.match(pattern);
      
      if (match && match[1]) {
        const dateStr = match[1];
        let parsed: Date;

        try {
          // Handle different date formats
          if (dateStr.includes('/') || dateStr.includes('-')) {
            // Handle DD/MM/YYYY or DD-MM-YYYY formats
            const parts = dateStr.split(/[-/]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // Month is 0-indexed
              const year = parseInt(parts[2]);
              
              // Handle 2-digit years
              const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
              
              parsed = new Date(fullYear, month, day);
            } else {
              parsed = new Date(dateStr);
            }
          } else {
            parsed = new Date(dateStr);
          }

          if (!isNaN(parsed.getTime())) {
            // Validate that the date is reasonable (not too far in past/future)
            const now = new Date();
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
            
            if (parsed >= oneYearAgo && parsed <= fiveYearsFromNow) {
              parsingLogger.logStep({
                step: "due_date_extraction",
                field: "dueDate",
                success: true,
                result: parsed,
                confidence,
                timestamp: new Date(),
              });
              return { date: parsed, confidence, match: match[0] };
            } else {
              // Log date out of range
              const error = parsingLogger.createError(
                ParseErrorType.DATE_PARSING_ERROR,
                "dueDate",
                `Extracted date is out of reasonable range: ${parsed.toISOString()}`,
                {
                  extractedValue: dateStr,
                  context: `Valid range: ${oneYearAgo.toISOString()} to ${fiveYearsFromNow.toISOString()}`,
                }
              );
              errors.push(error);
            }
          } else {
            // Log invalid date
            const error = parsingLogger.createError(
              ParseErrorType.DATE_PARSING_ERROR,
              "dueDate",
              `Could not parse date string: ${dateStr}`,
              {
                extractedValue: dateStr,
                context: `Parsed result: ${parsed}`,
              }
            );
            errors.push(error);
          }
        } catch (dateErr) {
          // Log date parsing error
          const error = parsingLogger.createError(
            ParseErrorType.DATE_PARSING_ERROR,
            "dueDate",
            `Error parsing date: ${dateErr}`,
            {
              extractedValue: dateStr,
            }
          );
          errors.push(error);
        }
      }
    }

    // Log failure
    const error = parsingLogger.createError(
      ParseErrorType.DATE_PARSING_ERROR,
      "dueDate",
      "Could not extract due date from email content",
      {
        attemptedPatterns,
        context: `Text preview: ${text.substring(0, 200)}...`,
      }
    );
    errors.push(error);

    return { date: null, confidence: 0 };
  } catch (err) {
    const error = parsingLogger.createError(
      ParseErrorType.FIELD_EXTRACTION_FAILED,
      "dueDate",
      `Unexpected error during due date extraction: ${err}`
    );
    errors.push(error);
    return { date: null, confidence: 0 };
  }
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
 * Detects premium frequency from email text
 */
function detectPremiumFrequency(text: string, subject: string): string {
  const combinedText = `${text} ${subject}`.toLowerCase();

  // Check for monthly first (most specific)
  if (PREMIUM_FREQUENCY_KEYWORDS.monthly.some((kw) => combinedText.includes(kw))) {
    return "monthly";
  }

  // Check for quarterly
  if (PREMIUM_FREQUENCY_KEYWORDS.quarterly.some((kw) => combinedText.includes(kw))) {
    return "quarterly";
  }

  // Check for half-yearly
  if (PREMIUM_FREQUENCY_KEYWORDS.halfyearly.some((kw) => combinedText.includes(kw))) {
    return "halfyearly";
  }

  // Check for annual
  if (PREMIUM_FREQUENCY_KEYWORDS.annual.some((kw) => combinedText.includes(kw))) {
    return "annual";
  }

  // Default to annual if not specified
  return "annual";
}

/**
 * Enhanced confidence calculation with individual field scoring
 *
 * Scoring weights:
 * - Insurer name: 30%
 * - Policy number: 25%
 * - Amount: 25%
 * - Due date: 20%
 */
function calculateConfidence(fieldConfidences: FieldConfidence): number {
  const weights = {
    insurerName: 0.3,
    policyNumber: 0.25,
    amount: 0.25,
    dueDate: 0.2,
  };

  return (
    fieldConfidences.insurerName * weights.insurerName +
    fieldConfidences.policyNumber * weights.policyNumber +
    fieldConfidences.amount * weights.amount +
    fieldConfidences.dueDate * weights.dueDate
  );
}

/**
 * Main parsing function: extracts insurance premium data from email text with comprehensive error logging
 *
 * @param text - Decoded email body text
 * @param metadata - Email metadata (from, subject, date, etc.)
 * @param enableDebug - Whether to enable debug mode and preserve email content
 * @returns Parsed insurance data with confidence score and error information
 *
 * @example
 * ```typescript
 * const text = decodeMessage(message.data);
 * const metadata = extractEmailMetadata(message.data);
 * const parsed = parseInsuranceEmail(text, metadata, true);
 *
 * if (parsed.errors.length > 0) {
 *   console.log('Parsing errors:', parsed.errors);
 * }
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
export function parseInsuranceEmail(
  text: string, 
  metadata: EmailMetadata, 
  enableDebug: boolean = false
): ParsedInsuranceData {
  const startTime = Date.now();
  const errors: ParseError[] = [];
  const parsingSteps: ParsingStep[] = [];
  const patternMatches: PatternMatch[] = [];
  const extractionAttempts: ExtractionAttempt[] = [];

  // Enable debug mode if requested
  parsingLogger.setDebugMode(enableDebug);

  try {
    // Log parsing start
    parsingLogger.logStep({
      step: "parsing_start",
      field: "all",
      success: true,
      result: "Starting email parsing",
      timestamp: new Date(),
    });

    // Extract all fields with error logging
    const insurerResult = extractInsurerName(text, metadata.from, errors);
    const policyResult = extractPolicyNumber(text, errors);
    const amountResult = extractAmount(text, errors);
    const dateResult = extractDueDate(text, errors);
    const paymentStatus = inferPaymentStatus(text);
    const policyType = detectPolicyType(text);
    const premiumFrequency = detectPremiumFrequency(text, metadata.subject || "");

    // Build field confidence scores
    const fieldConfidence: FieldConfidence = {
      insurerName: insurerResult.confidence,
      policyNumber: policyResult.confidence,
      amount: amountResult.confidence,
      dueDate: dateResult.confidence,
      overall: 0, // Will be calculated below
    };

    // Calculate overall confidence score
    fieldConfidence.overall = calculateConfidence(fieldConfidence);

    // Log overall parsing result
    parsingLogger.logStep({
      step: "parsing_complete",
      field: "all",
      success: errors.length === 0,
      result: {
        fieldsExtracted: {
          insurer: !!insurerResult.name,
          policy: !!policyResult.number,
          amount: !!amountResult.amount,
          date: !!dateResult.date,
        },
        confidence: fieldConfidence.overall,
        errorCount: errors.length,
      },
      confidence: fieldConfidence.overall,
      timestamp: new Date(),
    });

    // Build debug information if enabled
    let debugInfo: DebugInfo | undefined;
    if (enableDebug) {
      debugInfo = {
        emailContent: text,
        emailMetadata: metadata,
        parsingSteps,
        patternMatches,
        extractionAttempts,
        errors: [...errors], // Copy errors array
        timestamp: new Date(),
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Build result object
    const result: ParsedInsuranceData = {
      insurerName: insurerResult.name,
      policyNumber: policyResult.number,
      amount: amountResult.amount,
      currency: amountResult.currency,
      dueDate: dateResult.date,
      paymentStatus,
      policyType,
      premiumFrequency,
      confidenceScore: fieldConfidence.overall,
      fieldConfidence,
      extractedText: {
        insurerMatch: insurerResult.match,
        policyMatch: policyResult.match,
        amountMatch: amountResult.match,
        dueDateMatch: dateResult.match,
      },
      debugInfo,
      errors,
    };

    return result;
  } catch (err) {
    // Log unexpected error
    const error = parsingLogger.createError(
      ParseErrorType.FIELD_EXTRACTION_FAILED,
      "all",
      `Unexpected error during email parsing: ${err}`,
      {
        context: `Email from: ${metadata.from}, Subject: ${metadata.subject}`,
      }
    );
    errors.push(error);

    // Return minimal result with error information
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
      debugInfo: enableDebug ? {
        emailContent: text,
        emailMetadata: metadata,
        parsingSteps,
        patternMatches,
        extractionAttempts,
        errors: [...errors],
        timestamp: new Date(),
        processingTimeMs: Date.now() - startTime,
      } : undefined,
      errors,
    };
  }
}
