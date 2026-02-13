/**
 * Hybrid Insurance Email Parser
 * 
 * Combines regex-based parsing with LLM fallback for optimal accuracy and cost.
 * 
 * Strategy:
 * 1. Try regex extraction first (fast, free)
 * 2. If confidence < threshold, use LLM to re-parse
 * 3. Merge results, preferring higher confidence values
 * 
 * This approach:
 * - Keeps costs low (only ~30-40% of emails need LLM)
 * - Maintains speed for well-formatted emails
 * - Achieves high accuracy on edge cases
 */

import { parseInsuranceEmail as parseInsuranceEmailRegex, type ParsedInsuranceData } from "./insurance";
import { extractWithLLM, isLLMAvailable } from "./llmParser";
import type { EmailMetadata } from "@/lib/gmail/decodeMessage";

/**
 * Configuration for hybrid parsing
 */
export interface HybridParserConfig {
  /**
   * Confidence threshold below which LLM fallback is triggered
   * Default: 0.6 (60%)
   */
  llmFallbackThreshold: number;

  /**
   * Whether to always use LLM in addition to regex (for comparison/validation)
   * Default: false
   */
  alwaysUseLLM: boolean;

  /**
   * Whether to enable debug mode with detailed logging
   * Default: false
   */
  enableDebug: boolean;

  /**
   * Strategy for merging regex and LLM results
   * - "prefer_llm": Always prefer LLM results when available
   * - "prefer_regex": Prefer regex results, use LLM only for missing fields
   * - "highest_confidence": Use whichever has higher confidence per field
   * Default: "highest_confidence"
   */
  mergeStrategy: "prefer_llm" | "prefer_regex" | "highest_confidence";
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: HybridParserConfig = {
  llmFallbackThreshold: 0.6,
  alwaysUseLLM: false,
  enableDebug: false,
  mergeStrategy: "highest_confidence",
};

/**
 * Merge two parsed results based on strategy
 */
function mergeResults(
  regexResult: ParsedInsuranceData,
  llmResult: Partial<ParsedInsuranceData>,
  strategy: HybridParserConfig["mergeStrategy"]
): ParsedInsuranceData {
  if (strategy === "prefer_llm") {
    // Use LLM results, fallback to regex for missing fields
    return {
      ...regexResult,
      ...llmResult,
      confidenceScore: Math.max(
        regexResult.confidenceScore,
        llmResult.confidenceScore || 0
      ),
      fieldConfidence: {
        insurerName: llmResult.fieldConfidence?.insurerName || regexResult.fieldConfidence.insurerName,
        policyNumber: llmResult.fieldConfidence?.policyNumber || regexResult.fieldConfidence.policyNumber,
        amount: llmResult.fieldConfidence?.amount || regexResult.fieldConfidence.amount,
        dueDate: llmResult.fieldConfidence?.dueDate || regexResult.fieldConfidence.dueDate,
        overall: Math.max(
          regexResult.fieldConfidence.overall,
          llmResult.fieldConfidence?.overall || 0
        ),
      },
    };
  }

  if (strategy === "prefer_regex") {
    // Use regex results, only fill in missing fields from LLM
    return {
      ...regexResult,
      insurerName: regexResult.insurerName || llmResult.insurerName || null,
      policyNumber: regexResult.policyNumber || llmResult.policyNumber || null,
      amount: regexResult.amount || llmResult.amount || null,
      dueDate: regexResult.dueDate || llmResult.dueDate || null,
      confidenceScore: Math.max(
        regexResult.confidenceScore,
        llmResult.confidenceScore || 0
      ),
    };
  }

  // Default: highest_confidence - pick best value for each field
  const merged: ParsedInsuranceData = { ...regexResult };

  // Compare field by field
  if (
    llmResult.fieldConfidence?.insurerName &&
    llmResult.fieldConfidence.insurerName > regexResult.fieldConfidence.insurerName
  ) {
    merged.insurerName = llmResult.insurerName || null;
    merged.fieldConfidence.insurerName = llmResult.fieldConfidence.insurerName;
  }

  if (
    llmResult.fieldConfidence?.policyNumber &&
    llmResult.fieldConfidence.policyNumber > regexResult.fieldConfidence.policyNumber
  ) {
    merged.policyNumber = llmResult.policyNumber || null;
    merged.fieldConfidence.policyNumber = llmResult.fieldConfidence.policyNumber;
  }

  if (
    llmResult.fieldConfidence?.amount &&
    llmResult.fieldConfidence.amount > regexResult.fieldConfidence.amount
  ) {
    merged.amount = llmResult.amount || null;
    merged.fieldConfidence.amount = llmResult.fieldConfidence.amount;
  }

  if (
    llmResult.fieldConfidence?.dueDate &&
    llmResult.fieldConfidence.dueDate > regexResult.fieldConfidence.dueDate
  ) {
    merged.dueDate = llmResult.dueDate || null;
    merged.fieldConfidence.dueDate = llmResult.fieldConfidence.dueDate;
  }

  // Recalculate overall confidence
  merged.fieldConfidence.overall = (
    merged.fieldConfidence.insurerName * 0.3 +
    merged.fieldConfidence.policyNumber * 0.25 +
    merged.fieldConfidence.amount * 0.25 +
    merged.fieldConfidence.dueDate * 0.2
  );
  merged.confidenceScore = merged.fieldConfidence.overall;

  return merged;
}

/**
 * Main hybrid parsing function
 * 
 * @param emailText - Decoded email body text
 * @param metadata - Email metadata (from, subject, date)
 * @param config - Hybrid parser configuration
 * @returns Parsed insurance data with optimal confidence
 * 
 * @example
 * ```typescript
 * const text = decodeMessage(message.data);
 * const metadata = extractEmailMetadata(message.data);
 * 
 * const parsed = await parseInsuranceEmailHybrid(text, metadata, {
 *   llmFallbackThreshold: 0.6,
 *   enableDebug: true,
 * });
 * 
 * console.log('Confidence:', parsed.confidenceScore);
 * console.log('Used LLM:', parsed.confidenceScore > 0.6);
 * ```
 */
export async function parseInsuranceEmailHybrid(
  emailText: string,
  metadata: EmailMetadata,
  config: Partial<HybridParserConfig> = {}
): Promise<ParsedInsuranceData> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  console.log("[HYBRID] Starting hybrid parsing...");

  // Step 1: Always try regex first
  console.log("[HYBRID] Step 1: Regex extraction");
  const regexResult = parseInsuranceEmailRegex(
    emailText,
    metadata,
    finalConfig.enableDebug
  );

  console.log("[HYBRID] Regex confidence:", regexResult.confidenceScore);
  console.log("[HYBRID] Regex extracted:", {
    insurer: regexResult.insurerName,
    policy: regexResult.policyNumber,
    amount: regexResult.amount,
    dueDate: regexResult.dueDate,
  });

  // Step 2: Decide if LLM is needed
  const needsLLM =
    finalConfig.alwaysUseLLM ||
    regexResult.confidenceScore < finalConfig.llmFallbackThreshold;

  if (!needsLLM) {
    console.log("[HYBRID] ✅ Regex confidence sufficient, skipping LLM");
    const processingTime = Date.now() - startTime;
    console.log(`[HYBRID] Total time: ${processingTime}ms`);
    return regexResult;
  }

  // Step 3: Check if LLM is available
  if (!isLLMAvailable()) {
    console.warn(
      "[HYBRID] ⚠️ LLM needed but not configured, using regex results only"
    );
    const processingTime = Date.now() - startTime;
    console.log(`[HYBRID] Total time: ${processingTime}ms`);
    return regexResult;
  }

  // Step 4: Use LLM fallback
  console.log("[HYBRID] Step 2: LLM extraction (low confidence)");
  const llmResult = await extractWithLLM(emailText, metadata);

  console.log("[HYBRID] LLM confidence:", llmResult.confidenceScore);
  console.log("[HYBRID] LLM extracted:", {
    insurer: llmResult.insurerName,
    policy: llmResult.policyNumber,
    amount: llmResult.amount,
    dueDate: llmResult.dueDate,
  });

  // Step 5: Merge results
  console.log("[HYBRID] Step 3: Merging results");
  const mergedResult = mergeResults(
    regexResult,
    llmResult,
    finalConfig.mergeStrategy
  );

  const processingTime = Date.now() - startTime;
  console.log(`[HYBRID] ✅ Hybrid parsing complete in ${processingTime}ms`);
  console.log("[HYBRID] Final confidence:", mergedResult.confidenceScore);
  console.log("[HYBRID] Final result:", {
    insurer: mergedResult.insurerName,
    policy: mergedResult.policyNumber,
    amount: mergedResult.amount,
    dueDate: mergedResult.dueDate,
  });

  return mergedResult;
}

/**
 * Convenience function with default config
 */
export async function parseInsuranceEmailSimple(
  emailText: string,
  metadata: EmailMetadata
): Promise<ParsedInsuranceData> {
  return parseInsuranceEmailHybrid(emailText, metadata);
}
