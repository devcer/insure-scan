/**
 * Extract full domain from email address
 * Handles both plain email (user@domain.com) and RFC 5322 format ("Display Name" <user@domain.com>)
 * @param email - Email address or full "from" field
 * @returns Full domain (e.g., starhealth.in)
 */
export function extractFullDomainFromEmail(email: string): string {
  try {
    // Extract email from angle brackets if present: "Display Name" <email@domain.com>
    const emailMatch = email.match(/<([^>]+)>/);
    const cleanEmail = emailMatch ? emailMatch[1].trim() : email.trim();

    const domain = cleanEmail.split("@")[1]?.toLowerCase().trim();

    if (!domain) {
      console.log(`[DOMAIN] ⚠️ Could not extract domain from: ${email}`);
      return "unknown";
    }

    console.log(`[DOMAIN] 🔍 Extracted domain: ${domain} from: ${email}`);
    return domain;
  } catch (error) {
    console.error(`[DOMAIN] ❌ Error extracting domain from ${email}:`, error);
    return "unknown";
  }
}

/**
 * Aggregator domains that should return "Unknown" for company name
 */
const AGGREGATOR_DOMAINS = [
  "policybazaar.com",
  "coverfox.com",
  "renewbuy.com",
  "turtlemint.com",
  "bankbazaar.com",
  "paisabazaar.com",
  "insurancedekho.com",
  "oneassist.in",
  "phonepe.com",
  "paytm.com",
  "amazon.in",
  "flipkart.com",
];

/**
 * Map full domains to known insurance company names
 * Based on insuranceDomains from app/queries.ts
 */
const DOMAIN_TO_COMPANY: Record<string, string> = {
  // Health Insurance Companies
  "starhealth.in": "Star Health Insurance",
  "nivabupa.com": "Niva Bupa Health Insurance",
  "maxbupa.com": "Max Bupa Health Insurance",
  "hdfcergo.com": "HDFC ERGO Health Insurance",
  "icicilombard.com": "ICICI Lombard",
  "tataaig.com": "Tata AIG",
  "careinsurance.com": "Care Health Insurance",
  "adityabirlahealth.com": "Aditya Birla Health Insurance",
  "adityabirlacapital.com": "Aditya Birla Capital",
  "manipalcigna.com": "Manipal Cigna Health Insurance",
  "manipalcignahealthinsurance.com": "Manipal Cigna Health Insurance",
  "manipalgroup.com": "Manipal Group",
  "manipalswastya.com": "Manipal Swastya",
  "religarehealth.com": "Religare Health Insurance",

  // Life Insurance Companies
  "licindia.com": "LIC (Life Insurance Corporation of India)",
  "hdfclife.com": "HDFC Life Insurance",
  "iciciprulife.com": "ICICI Prudential Life Insurance",
  "maxlifeinsurance.com": "Max Life Insurance",
  "sbilife.co.in": "SBI Life Insurance",
  "bajajallianzlife.com": "Bajaj Allianz Life Insurance",
  "kotaklife.com": "Kotak Life Insurance",
  "adityabirlalife.com": "Aditya Birla Sun Life Insurance",
  "canarahsbclife.com": "Canara HSBC Life Insurance",
  "pramericalife.in": "Pramerica Life Insurance",
  "exidelife.in": "Exide Life Insurance",
  "sudlife.in": "SUD Life Insurance",
  "aegonlife.com": "Aegon Life Insurance",
  "dhflpramerica.com": "DHFL Pramerica Life Insurance",
  "idbifederal.com": "IDBI Federal Life Insurance",
  "pnbmetlife.com": "PNB MetLife Insurance",
  "bhartiaxa.com": "Bharti AXA Life Insurance",

  // General Insurance Companies
  "bajajallianz.com": "Bajaj Allianz General Insurance",
  "bajajallianzgeneral.com": "Bajaj Allianz General Insurance",
  "futuregenerali.in": "Future Generali India Insurance",
  "futuregenerali.com": "Future Generali India Insurance",
  "kotakgeneral.com": "Kotak General Insurance",
  "reliancegeneral.co.in": "Reliance General Insurance",
  "sbigeneral.in": "SBI General Insurance",
  "tataaia.com": "Tata AIA Life Insurance",
  "unitedindia.co.in": "United India Insurance",
  "newindia.co.in": "New India Assurance",
  "orientalinsurance.org.in": "Oriental Insurance",
  "nationalinsurance.nic.co.in": "National Insurance",
  "iffcotokio.co.in": "IFFCO Tokio General Insurance",
  "rahejaqbe.com": "Raheja QBE General Insurance",
  "universal-sompo.com": "Universal Sompo General Insurance",
  "shriramgi.com": "Shriram General Insurance",
  "shriramlife.com": "Shriram Life Insurance",
  "edelweisstokio.in": "Edelweiss Tokio Life Insurance",
  "sundaramfinance.in": "Sundaram Finance",
  "magmageneral.com": "Magma HDI General Insurance",
  "libertyinsurance.in": "Liberty General Insurance",

  // Digital Insurance Companies
  "digitinsurance.com": "Digit Insurance",
  "acko.com": "Acko General Insurance",
  "godigit.com": "Go Digit General Insurance",
  "zuno.com": "Zuno General Insurance",
  "zunoinsurance.com": "Zuno General Insurance",

  // Motor Insurance
  "chola.ms": "Cholamandalam MS General Insurance",
  "cholainsurance.com": "Cholamandalam MS General Insurance",

  // Banking Associated
  "sbi.co.in": "State Bank of India Insurance",
};

/**
 * Get insurance company name from email domain
 * @param email - Email address
 * @returns Company name or "Unknown" if aggregator/not recognized
 */
export function getCompanyNameFromEmail(email: string): string {
  if (!email) {
    console.log("[DOMAIN] Empty email, returning Unknown");
    return "Unknown";
  }

  const fullDomain = extractFullDomainFromEmail(email);
  console.log(`[DOMAIN] Extracted domain: ${fullDomain} from email: ${email}`);

  // Check if it's an aggregator domain (exact match)
  if (AGGREGATOR_DOMAINS.includes(fullDomain)) {
    console.log(`[DOMAIN] ⚠️ Aggregator detected: ${fullDomain}`);
    return "Unknown";
  }

  // Check if the domain ends with any known insurance domain
  for (const [knownDomain, companyName] of Object.entries(DOMAIN_TO_COMPANY)) {
    if (fullDomain.endsWith(knownDomain)) {
      console.log(`[DOMAIN] ✅ Match found: ${fullDomain} ends with ${knownDomain} → ${companyName}`);
      return companyName;
    }
  }

  // If not found, return "Unknown"
  console.log(`[DOMAIN] ❌ No match found for: ${fullDomain}`);
  return "Unknown";
}
