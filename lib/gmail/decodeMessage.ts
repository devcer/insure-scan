/**
 * Email Content Decoding Utility
 *
 * Extracts and decodes email content from Gmail API message payloads.
 * Handles base64url encoding, MIME multipart structures, and HTML-to-text conversion.
 *
 * Usage:
 * ```typescript
 * import { decodeMessage, extractEmailMetadata } from '@/lib/gmail/decodeMessage';
 * import { getEmailMessage } from '@/lib/gmail/gmailClient';
 *
 * const gmail = createGmailClient(accessToken);
 * const message = await getEmailMessage(gmail, { messageId: 'abc123' });
 *
 * const text = decodeMessage(message.data);
 * const metadata = extractEmailMetadata(message.data);
 *
 * console.log('Subject:', metadata.subject);
 * console.log('Content:', text);
 * ```
 */

import { gmail_v1 } from "googleapis";
import { convert } from "html-to-text";

/**
 * Email metadata extracted from headers
 */
export interface EmailMetadata {
  subject: string;
  from: string;
  to: string;
  date: string;
  messageId: string;
}

/**
 * Decodes base64url-encoded string to UTF-8 text
 *
 * Gmail API uses RFC 4648 base64url encoding (not standard base64)
 * - Uses - instead of +
 * - Uses _ instead of /
 * - No padding (=) characters
 */
function decodeBase64Url(encoded: string): string {
  try {
    // Convert base64url to standard base64
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const paddingNeeded = (4 - (base64.length % 4)) % 4;
    base64 += "=".repeat(paddingNeeded);

    // Decode base64 to buffer, then to UTF-8 string
    const buffer = Buffer.from(base64, "base64");
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Failed to decode base64url:", error);
    return "";
  }
}

/**
 * Converts HTML content to plain text
 *
 * Uses html-to-text library with sensible defaults:
 * - Preserves line breaks from <br> and block elements
 * - Converts links to [text](url) format
 * - Extracts text from tables
 * - Removes scripts, styles, and other non-content tags
 */
function htmlToText(html: string): string {
  try {
    return convert(html, {
      wordwrap: false,
      preserveNewlines: true,
      selectors: [
        // Remove unwanted elements
        { selector: "img", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "script", format: "skip" },
        // Format links
        { selector: "a", options: { ignoreHref: false } },
        // Preserve structure
        { selector: "table", options: { uppercaseHeaderCells: false } },
      ],
    });
  } catch (error) {
    console.error("Failed to convert HTML to text:", error);
    return html; // Return raw HTML if conversion fails
  }
}

/**
 * Recursively searches MIME parts for text content
 *
 * Gmail messages use MIME multipart structure:
 * - multipart/alternative: Contains both text/plain and text/html versions
 * - multipart/mixed: Contains body + attachments
 * - multipart/related: Contains HTML + embedded images
 *
 * This function:
 * 1. Prefers text/plain over text/html
 * 2. Recursively searches nested multipart structures
 * 3. Decodes base64url-encoded content
 * 4. Converts HTML to text as fallback
 */
function extractTextFromParts(parts: gmail_v1.Schema$MessagePart[] | undefined, preferPlainText: boolean = true): string {
  if (!parts || parts.length === 0) {
    return "";
  }

  let plainText = "";
  let htmlText = "";

  for (const part of parts) {
    const mimeType = part.mimeType?.toLowerCase();

    // Handle nested multipart structures recursively
    if (mimeType?.startsWith("multipart/")) {
      const nestedText = extractTextFromParts(part.parts, preferPlainText);
      if (nestedText) {
        return nestedText; // Return first non-empty result
      }
      continue;
    }

    // Extract text/plain content
    if (mimeType === "text/plain" && part.body?.data) {
      plainText = decodeBase64Url(part.body.data);
      if (preferPlainText && plainText) {
        return plainText;
      }
    }

    // Extract text/html content
    if (mimeType === "text/html" && part.body?.data) {
      const html = decodeBase64Url(part.body.data);
      htmlText = htmlToText(html);
    }
  }

  // Prefer plain text, fallback to HTML
  return plainText || htmlText;
}

/**
 * Decodes and extracts email body content from Gmail message
 *
 * Handles three message structures:
 * 1. Simple message: Body directly in payload.body.data
 * 2. Multipart message: Body in payload.parts
 * 3. Nested multipart: Recursively searches parts
 *
 * @param message - Gmail API message object
 * @returns Decoded email body as plain text
 *
 * @example
 * ```typescript
 * const message = await gmail.users.messages.get({
 *   userId: 'me',
 *   id: messageId,
 * });
 *
 * const text = decodeMessage(message.data);
 * console.log(text);
 * ```
 */
export function decodeMessage(message: gmail_v1.Schema$Message): string {
  if (!message.payload) {
    return "";
  }

  const { payload } = message;

  // Case 1: Simple message with body directly in payload
  if (payload.body?.data) {
    const mimeType = payload.mimeType?.toLowerCase();
    const decodedText = decodeBase64Url(payload.body.data);

    if (mimeType === "text/html") {
      return htmlToText(decodedText);
    }

    return decodedText;
  }

  // Case 2: Multipart message with parts
  if (payload.parts && payload.parts.length > 0) {
    return extractTextFromParts(payload.parts, true);
  }

  // Case 3: No body content found
  console.warn("No body content found in message:", message.id);
  return "";
}

/**
 * Extracts email headers from Gmail message
 *
 * Headers include: Subject, From, To, Date, Message-ID, etc.
 *
 * @param message - Gmail API message object
 * @returns Array of header name-value pairs
 *
 * @example
 * ```typescript
 * const headers = extractHeaders(message.data);
 * const subject = headers.find(h => h.name === 'Subject')?.value;
 * ```
 */
export function extractHeaders(message: gmail_v1.Schema$Message): Array<{ name: string; value: string }> {
  if (!message.payload?.headers) {
    return [];
  }

  return message.payload.headers.filter((header): header is { name: string; value: string } => {
    return !!header.name && !!header.value;
  });
}

/**
 * Gets a specific header value from Gmail message
 *
 * @param message - Gmail API message object
 * @param headerName - Name of header to retrieve (case-insensitive)
 * @returns Header value or undefined if not found
 *
 * @example
 * ```typescript
 * const subject = getHeader(message.data, 'Subject');
 * const from = getHeader(message.data, 'From');
 * ```
 */
export function getHeader(message: gmail_v1.Schema$Message, headerName: string): string | undefined {
  const headers = extractHeaders(message);
  const header = headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase());
  return header?.value;
}

/**
 * Extracts common email metadata from Gmail message
 *
 * @param message - Gmail API message object
 * @returns Email metadata object with subject, from, to, date, messageId
 *
 * @example
 * ```typescript
 * const metadata = extractEmailMetadata(message.data);
 * console.log('From:', metadata.from);
 * console.log('Subject:', metadata.subject);
 * console.log('Date:', metadata.date);
 * ```
 */
export function extractEmailMetadata(message: gmail_v1.Schema$Message): EmailMetadata {
  return {
    subject: getHeader(message, "Subject") || "",
    from: getHeader(message, "From") || "",
    to: getHeader(message, "To") || "",
    date: getHeader(message, "Date") || "",
    messageId: getHeader(message, "Message-ID") || message.id || "",
  };
}

/**
 * Complete email extraction: metadata + decoded body
 *
 * Convenience function that combines metadata extraction and body decoding
 *
 * @param message - Gmail API message object
 * @returns Object with metadata and decoded body text
 *
 * @example
 * ```typescript
 * const { metadata, body } = extractFullEmail(message.data);
 *
 * console.log('Subject:', metadata.subject);
 * console.log('From:', metadata.from);
 * console.log('Body:', body);
 * ```
 */
export function extractFullEmail(message: gmail_v1.Schema$Message): {
  metadata: EmailMetadata;
  body: string;
} {
  return {
    metadata: extractEmailMetadata(message),
    body: decodeMessage(message),
  };
}
