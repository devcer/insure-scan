/**
 * Gmail Client Usage Examples
 * Demonstrates how to use the Gmail API utilities
 */

import { listInsuranceEmails, getEmailMessage, batchGetEmailMessages, isGmailApiError } from "./gmailClient";
import { INSURANCE_QUERY } from "./gmailQuery";

/**
 * Example 1: Fetch list of insurance emails
 */
export async function example1FetchEmailList(accessToken: string) {
  const result = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    maxResults: 50,
  });

  if (isGmailApiError(result)) {
    console.error("Error fetching emails:", result.error);
    return null;
  }

  console.log(`Found ${result.resultSizeEstimate} emails`);
  console.log(`Fetched ${result.messages?.length} message IDs`);

  return result;
}

/**
 * Example 2: Fetch a single email with full details
 */
export async function example2FetchSingleEmail(accessToken: string, messageId: string) {
  const result = await getEmailMessage({
    accessToken,
    messageId,
    format: "full",
  });

  if (isGmailApiError(result)) {
    console.error("Error fetching message:", result.error);
    return null;
  }

  // Extract common headers
  const headers = result.message.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

  console.log("Subject:", getHeader("Subject"));
  console.log("From:", getHeader("From"));
  console.log("Date:", getHeader("Date"));

  return result.message;
}

/**
 * Example 3: Fetch all insurance emails with full details
 */
export async function example3FetchAllEmailsWithDetails(accessToken: string) {
  // Step 1: Get list of message IDs
  const listResult = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    maxResults: 100,
  });

  if (isGmailApiError(listResult)) {
    console.error("Error listing emails:", listResult.error);
    return [];
  }

  if (!listResult.messages || listResult.messages.length === 0) {
    console.log("No emails found");
    return [];
  }

  // Step 2: Extract message IDs
  const messageIds = listResult.messages.map((msg) => msg.id).filter((id): id is string => Boolean(id));

  console.log(`Fetching details for ${messageIds.length} emails...`);

  // Step 3: Batch fetch full message details
  const messages = await batchGetEmailMessages(accessToken, messageIds, "full");

  console.log(`Successfully fetched ${messages.length} email details`);

  return messages;
}

/**
 * Example 4: Paginate through all results
 */
export async function example4PaginateThroughAllEmails(accessToken: string) {
  const allMessages: Array<{ id?: string | null; threadId?: string | null }> = [];
  let pageToken: string | undefined = undefined;
  let pageCount = 0;

  do {
    const result = await listInsuranceEmails({
      accessToken,
      query: INSURANCE_QUERY,
      maxResults: 100,
      pageToken,
    });

    if (isGmailApiError(result)) {
      console.error("Error fetching page:", result.error);
      break;
    }

    if (result.messages) {
      allMessages.push(...result.messages);
    }

    pageToken = result.nextPageToken;
    pageCount++;

    console.log(`Fetched page ${pageCount}, total messages: ${allMessages.length}`);
  } while (pageToken);

  console.log(`Total emails fetched: ${allMessages.length} across ${pageCount} pages`);

  return allMessages;
}

/**
 * Example 5: Extract email metadata without full body
 */
export async function example5FetchMetadataOnly(accessToken: string, messageId: string) {
  const result = await getEmailMessage({
    accessToken,
    messageId,
    format: "metadata", // Faster, smaller response
  });

  if (isGmailApiError(result)) {
    console.error("Error fetching metadata:", result.error);
    return null;
  }

  // Extract metadata
  const headers = result.message.payload?.headers || [];
  const metadata = {
    id: result.message.id,
    threadId: result.message.threadId,
    subject: headers.find((h) => h.name === "Subject")?.value,
    from: headers.find((h) => h.name === "From")?.value,
    to: headers.find((h) => h.name === "To")?.value,
    date: headers.find((h) => h.name === "Date")?.value,
    snippet: result.message.snippet,
  };

  return metadata;
}

/**
 * Example 6: Handle errors gracefully
 */
export async function example6ErrorHandling(accessToken: string) {
  try {
    const result = await listInsuranceEmails({
      accessToken,
      query: INSURANCE_QUERY,
      maxResults: 50,
    });

    if (isGmailApiError(result)) {
      // Handle API error
      console.error("Gmail API error:", result.error);

      // Check if it's an authentication error
      if (typeof result.details === "object" && result.details !== null) {
        const details = result.details as { code?: number };
        if (details.code === 401) {
          console.log("Access token expired, need to refresh");
        }
      }

      return null;
    }

    return result.messages;
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected error:", error);
    return null;
  }
}

/**
 * Example 7: Process emails in batches (memory efficient)
 */
export async function example7ProcessInBatches(accessToken: string, batchSize: number = 20) {
  // Get all message IDs
  const listResult = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    maxResults: 500,
  });

  if (isGmailApiError(listResult) || !listResult.messages) {
    console.error("Failed to get message list");
    return;
  }

  const messageIds = listResult.messages.map((msg) => msg.id).filter((id): id is string => Boolean(id));

  // Process in batches
  const processedMessages = [];
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batchIds = messageIds.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

    const batchMessages = await batchGetEmailMessages(accessToken, batchIds, "metadata");

    processedMessages.push(...batchMessages);

    // Optional: Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Processed ${processedMessages.length} messages in total`);
  return processedMessages;
}

/**
 * Example 8: Use in API route
 */
export async function example8ApiRouteUsage(accessToken: string) {
  // This would typically be in an API route like /api/emails/route.ts

  const result = await listInsuranceEmails({
    accessToken,
    query: INSURANCE_QUERY,
    maxResults: 100,
  });

  if (isGmailApiError(result)) {
    return {
      success: false,
      error: result.error,
      status: 500,
    };
  }

  return {
    success: true,
    data: {
      messages: result.messages || [],
      nextPageToken: result.nextPageToken,
      total: result.resultSizeEstimate || 0,
    },
    status: 200,
  };
}
