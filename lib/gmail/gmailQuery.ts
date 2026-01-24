/**
 * Gmail Query Utilities
 * Exports optimized Gmail search queries for fetching insurance-related emails
 */

import { attachmentQuery } from "@/app/queries";

/**
 * Strict Gmail query for Indian health insurance premium/renewal emails
 *
 * This query:
 * - Searches emails from last 365 days
 * - Filters by 130+ Indian insurance provider domains
 * - Only includes emails with attachments (policy documents, receipts, etc.)
 * - Excludes promotional/social/forum categories
 *
 * @example
 * const emails = await listInsuranceEmails({
 *   accessToken,
 *   query: INSURANCE_QUERY,
 *   maxResults: 100
 * });
 */
export const INSURANCE_QUERY = attachmentQuery;

/**
 * Default maximum number of emails to fetch per request
 */
export const DEFAULT_MAX_RESULTS = 100;

/**
 * Maximum allowed by Gmail API per request
 */
export const MAX_RESULTS_LIMIT = 500;
