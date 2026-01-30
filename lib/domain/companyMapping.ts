/**
 * Extract domain name from email address
 * @param email - Email address (e.g., no-reply@agrigator.com)
 * @returns Domain name (e.g., agrigator)
 */
export function extractDomainFromEmail(email: string): string {
  try {
    // Remove everything before @ and after the first dot
    const domain = email.split("@")[1]?.split(".")[0]?.toLowerCase();
    return domain || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Map domain names to known insurance company names
 * Extend this object as you identify more insurance companies
 */
const DOMAIN_TO_COMPANY: Record<string, string> = {
  // Health Insurance
  aditya: "Aditya Birla Health Insurance",
  apollohealth: "Apollo Health Insurance",
  healthassure: "Health Assure",
  hdfc: "HDFC Life Insurance",
  lic: "LIC (Life Insurance Corporation)",
  max: "Max Life Insurance",
  religare: "Religare Health Insurance",
  starhealth: "Star Health Insurance",
  unite: "United India Insurance",
  icici: "ICICI Lombard",

  // Auto Insurance
  bajajfinserv: "Bajaj Finserv Insurance",
  bharti: "Bharti AXA Insurance",
  navi: "Navi Insurance",
  flipkart: "Flipkart Insurance",
  acko: "Acko Insurance",

  // Home Insurance
  allianz: "Allianz Insurance",
  bima: "Bima Insurance",

  // Travel Insurance
  travelagency: "Travel Agency Insurance",
};

/**
 * Get insurance company name from domain
 * @param email - Email address
 * @returns Company name or "Unknown" if not recognized
 */
export function getCompanyNameFromEmail(email: string): string {
  if (!email) return "Unknown";

  const domain = extractDomainFromEmail(email);

  // Check if domain is in our mapping
  const companyName = DOMAIN_TO_COMPANY[domain];

  if (companyName) {
    return companyName;
  }

  // If not found, return "Unknown"
  return "Unknown";
}
