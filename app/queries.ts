// Insurance provider domains (last updated: 20th Jan 2026)
export const insuranceDomains = [
  // Health Insurance
  "starhealth.in",
  "nivabupa.com",
  "maxbupa.com",
  "hdfcergo.com",
  "icicilombard.com",
  "tataaig.com",
  "careinsurance.com",
  "adityabirlahealth.com",
  "adityabirlacapital.com",
  "manipalcigna.com",
  "manipalcignahealthinsurance.com",
  "bajajallianz.com",
  "bajajallianzlife.com",
  "bajajallianzgeneral.com",
  "futuregenerali.in",
  "futuregenerali.com",
  "hdfclife.com",
  "hdfcergo.com",
  "iciciprulife.com",
  "icicilombard.com",
  "kotaklife.com",
  "kotakgeneral.com",
  "maxlifeinsurance.com",
  "maxbupa.com",
  "nivabupa.com",
  "reliancegeneral.co.in",
  "sbigeneral.in",
  "sbilife.co.in",
  "tataaia.com",
  "tataaig.com",
  "unitedindia.co.in",
  "newindia.co.in",
  "orientalinsurance.org.in",
  "nationalinsurance.nic.co.in",
  "iffcotokio.co.in",
  "rahejaqbe.com",
  "religarehealth.com",
  "careinsurance.com",
  "manipalgroup.com",
  "manipalswastya.com",
  "universal-sompo.com",
  "shriramgi.com",
  "shriramlife.com",
  "edelweisstokio.in",
  "canarahsbclife.com",
  "pramericalife.in",
  "exidelife.in",
  "sudlife.in",
  "aegonlife.com",
  "dhflpramerica.com",
  "idbifederal.com",
  "pnbmetlife.com",
  "bhartiaxa.com",
  "futuregenerali.in",
  "sundaramfinance.in",
  "magmageneral.com",
  "libertyinsurance.in",
  "digitinsurance.com",
  "acko.com",
  "godigit.com",
  "zuno.com",
  "zunoinsurance.com",
  "chola.ms",
  "cholainsurance.com",
  "sbi.co.in",
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
  // Life Insurance
  "licindia.com",
  "hdfclife.com",
  "iciciprulife.com",
  "maxlifeinsurance.com",
  "sbilife.co.in",
  "bajajallianzlife.com",
  "kotaklife.com",
  "adityabirlalife.com",
  "canarahsbclife.com",
  "pramericalife.in",
  "exidelife.in",
  "sudlife.in",
  "aegonlife.com",
  "dhflpramerica.com",
  "idbifederal.com",
  "pnbmetlife.com",
  "bhartiaxa.com",
  // General Insurance
  "newindia.co.in",
  "unitedindia.co.in",
  "orientalinsurance.org.in",
  "nationalinsurance.nic.co.in",
  "iffcotokio.co.in",
  "rahejaqbe.com",
  "reliancegeneral.co.in",
  "sbigeneral.in",
  "tataaig.com",
  "hdfcergo.com",
  "icicilombard.com",
  "bajajallianz.com",
  "futuregenerali.in",
  "shriramgi.com",
  "edelweisstokio.in",
  "libertyinsurance.in",
  "digitinsurance.com",
  "acko.com",
  "godigit.com",
  "zuno.com",
  "zunoinsurance.com",
  "chola.ms",
  "cholainsurance.com",
  // Brokers & Aggregators
  "policybazaar.com",
  "coverfox.com",
  "renewbuy.com",
  "turtlemint.com",
  "bankbazaar.com",
  "paisabazaar.com",
  "insurancedekho.com",
];

function buildFromClause(domains: string[]) {
  return domains.map((domain) => `from:${domain}`).join(" OR ");
}

export const query1 = `newer_than:365d
(
  ${buildFromClause(insuranceDomains)}
)
(
  subject:(premium OR renewal OR reminder OR due OR receipt OR invoice OR "policy renewal" OR "premium due" OR "payment due")
  OR
  ("pay now" OR payable OR "renew now" OR invoice OR receipt OR expiry OR expiration OR "payment successful" OR "payment received")
)
-category:social -category:forums -category:updates
`.trim();

export const strictQuery = `newer_than:365d
(
  ${buildFromClause(insuranceDomains)}
)
(
  subject:(
    "premium due" OR
    "payment due" OR
    "policy renewal" OR
    "renewal reminder" OR
    "receipt" OR
    "invoice" OR
    "payment successful"
  )
  OR
  (
    (premium OR renewal)
    ("pay now" OR payable OR "renew now")
  )
)
-category:social -category:forums -category:promotions -category:updates
`.trim();

export const attachmentQuery = `newer_than:365d
(
  ${buildFromClause(insuranceDomains)}
)
(
  subject:(
    premium OR renewal OR "payment due" OR "due date" OR 
    "policy renewal" OR "premium reminder" OR invoice OR receipt OR
    "payment successful" OR "payment received" OR "renew now" OR
    "policy issued" OR "policy document"
  )
  OR
  (
    (premium OR renewal OR payment OR policy)
    (due OR reminder OR invoice OR receipt OR issued)
  )
)
-category:social -category:forums -category:promotions
`.trim();

export const paymentQuery = `newer_than:365d
(
  ${buildFromClause(insuranceDomains)}
)
(
  (
    ("due")
  )
)
`.trim();

export const issuedPolicyQuery = `newer_than:365d
(
  ${buildFromClause(insuranceDomains)}
)
(
  (
    ("policy issued")
  )
)
`.trim();
