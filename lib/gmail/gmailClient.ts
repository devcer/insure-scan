/**
 * Gmail API Client Utilities
 * Provides helper functions for interacting with Gmail API using OAuth access tokens
 */

import { google, gmail_v1 } from "googleapis";
import { DEFAULT_MAX_RESULTS, MAX_RESULTS_LIMIT } from "./gmailQuery";

/**
 * Parameters for listing insurance emails
 */
export interface ListInsuranceEmailsParams {
  /** OAuth access token for Gmail API */
  accessToken: string;
  /** Gmail search query string */
  query: string;
  /** Maximum number of results to return (default: 100, max: 500) */
  maxResults?: number;
  /** Page token for pagination */
  pageToken?: string;
}

/**
 * Parameters for getting a single email message
 */
export interface GetEmailMessageParams {
  /** OAuth access token for Gmail API */
  accessToken: string;
  /** Gmail message ID */
  messageId: string;
  /** Format of the message response (default: 'full') */
  format?: "minimal" | "full" | "raw" | "metadata";
}

/**
 * Response from listInsuranceEmails
 */
export interface ListEmailsResponse {
  /** Array of message objects with id and threadId */
  messages?: gmail_v1.Schema$Message[];
  /** Token for fetching next page of results */
  nextPageToken?: string;
  /** Estimated total number of results */
  resultSizeEstimate?: number;
}

/**
 * Response from getEmailMessage
 */
export interface EmailMessageResponse {
  /** Full message object from Gmail API */
  message: gmail_v1.Schema$Message;
}

/**
 * Error response wrapper
 */
export interface GmailApiError {
  error: string;
  details?: unknown;
}

/**
 * Creates an authenticated Gmail API client
 *
 * @param accessToken - OAuth access token
 * @returns Configured Gmail API client
 */
function createGmailClient(accessToken: string): gmail_v1.Gmail {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * List insurance-related emails from Gmail
 *
 * Fetches a list of email message IDs and thread IDs matching the provided query.
 * Returns raw Gmail API response without parsing email content.
 *
 * @param params - Parameters for listing emails
 * @returns Promise with list of messages or error
 *
 * @example
 * const result = await listInsuranceEmails({
 *   accessToken: 'ya29.a0...',
 *   query: INSURANCE_QUERY,
 *   maxResults: 50
 * });
 *
 * if ('error' in result) {
 *   console.error('Failed to fetch emails:', result.error);
 * } else {
 *   console.log(`Found ${result.messages?.length} emails`);
 * }
 */
export async function listInsuranceEmails(params: ListInsuranceEmailsParams): Promise<ListEmailsResponse | GmailApiError> {
  const { accessToken, query, maxResults = DEFAULT_MAX_RESULTS, pageToken } = params;

  try {
    // Validate maxResults
    const limitedMaxResults = Math.min(maxResults, MAX_RESULTS_LIMIT);

    const gmail = createGmailClient(accessToken);

    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: limitedMaxResults,
      pageToken: pageToken,
    });

    return {
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken || undefined,
      resultSizeEstimate: response.data.resultSizeEstimate || 0,
    };
  } catch (error) {
    console.error("Error listing insurance emails:", error);

    return {
      error: "Failed to list insurance emails from Gmail",
      details: error,
    };
  }
}

/**
 * Get a single email message by ID
 *
 * Fetches complete email message details including headers, body, and attachments.
 * Returns raw Gmail API response without parsing.
 *
 * @param params - Parameters for getting email message
 * @returns Promise with full message data or error
 *
 * @example
 * const result = await getEmailMessage({
 *   accessToken: 'ya29.a0...',
 *   messageId: '18d1234567890abcd'
 * });
 *
 * if ('error' in result) {
 *   console.error('Failed to fetch message:', result.error);
 * } else {
 *   console.log('Subject:', result.message.payload?.headers?.find(h => h.name === 'Subject')?.value);
 * }
 */
export async function getEmailMessage(params: GetEmailMessageParams): Promise<EmailMessageResponse | GmailApiError> {
  const { accessToken, messageId, format = "full" } = params;

  try {
    const gmail = createGmailClient(accessToken);

    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: format,
    });

    return {
      message: response.data,
    };
  } catch (error) {
    console.error(`Error getting email message ${messageId}:`, error);

    return {
      error: `Failed to get email message with ID: ${messageId}`,
      details: error,
    };
  }
}

/**
 * Type guard to check if response is an error
 *
 * @param response - Response from Gmail API functions
 * @returns True if response contains an error
 *
 * @example
 * const result = await listInsuranceEmails({ ... });
 * if (isGmailApiError(result)) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.messages);
 * }
 */
export function isGmailApiError(response: ListEmailsResponse | EmailMessageResponse | GmailApiError): response is GmailApiError {
  return "error" in response;
}

/**
 * Batch fetch multiple email messages
 *
 * Fetches multiple email messages in parallel. Useful for getting details
 * of all messages returned from listInsuranceEmails.
 *
 * @param accessToken - OAuth access token
 * @param messageIds - Array of Gmail message IDs
 * @param format - Format of the message response
 * @returns Promise with array of messages (successful fetches only)
 *
 * @example
 * const list = await listInsuranceEmails({ ... });
 * if (!isGmailApiError(list) && list.messages) {
 *   const ids = list.messages.map(m => m.id).filter(Boolean);
 *   const messages = await batchGetEmailMessages(accessToken, ids as string[]);
 *   console.log(`Fetched ${messages.length} full messages`);
 * }
 */
export async function batchGetEmailMessages(
  accessToken: string,
  messageIds: string[],
  format: "minimal" | "full" | "raw" | "metadata" = "full"
): Promise<gmail_v1.Schema$Message[]> {
  const promises = messageIds.map((messageId) => getEmailMessage({ accessToken, messageId, format }));

  const results = await Promise.allSettled(promises);

  return results
    .filter(
      (result): result is PromiseFulfilledResult<EmailMessageResponse> => result.status === "fulfilled" && !isGmailApiError(result.value)
    )
    .map((result) => result.value.message);
}
