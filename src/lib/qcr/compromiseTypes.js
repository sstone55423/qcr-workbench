// Reference catalog of 21 widely-recognized cyber compromise types, plus a
// deterministic name-based classifier used by the "Learn more" screen.
//
// NOTE: the `name`/`brief` copy here is provisional English reference content
// meant to grow (deeper write-ups + recent-incident citations come later). It
// is intentionally NOT yet routed through the i18n dictionaries — unlike the
// UI chrome around it — to avoid translating placeholder catalog text into all
// seven languages before the content stabilizes. Revisit when the Learn-more
// screen is fleshed out.

// Each type: stable `id`, display `name`, `keywords` (lowercased match terms),
// and a one-paragraph `brief`. Ordered roughly by how commonly the term shows
// up in scenario names.
export const COMPROMISE_TYPES = [
  {
    id: 'business-email-compromise',
    name: 'Business Email Compromise (BEC)',
    keywords: ['business email', 'bec', 'email compromise', 'ceo fraud', 'invoice fraud', 'invoice', 'vendor email', 'wire fraud', 'wire transfer fraud'],
    brief: 'An attacker impersonates a trusted executive, employee, or vendor over email to trick staff into transferring funds or sensitive data. BEC relies on social engineering and account access rather than malware, which makes it hard to catch with technical controls alone and consistently one of the costliest categories reported to law enforcement.',
  },
  {
    id: 'ransomware',
    name: 'Ransomware',
    keywords: ['ransomware', 'ransom', 'extortion', 'encryption attack', 'crypto-locker', 'double extortion'],
    brief: 'Malware encrypts an organization’s data (and increasingly exfiltrates it first for "double extortion") and demands payment for a decryption key or to prevent leaks. Impact spans downtime, recovery cost, ransom payment, and regulatory exposure.',
  },
  {
    id: 'phishing',
    name: 'Phishing',
    keywords: ['phishing', 'spear phishing', 'spear-phishing', 'smishing', 'vishing', 'credential harvest', 'fake login'],
    brief: 'Fraudulent messages (email, SMS, voice) lure recipients into revealing credentials, opening malicious attachments, or approving actions. Phishing is the most common initial-access vector and frequently the first step in larger intrusions.',
  },
  {
    id: 'credential-theft',
    name: 'Credential Theft / Account Takeover',
    keywords: ['credential theft', 'credential stuffing', 'account takeover', 'stolen credentials', 'brute force', 'password spray', 'login attack', 'credential', 'sim-swap', 'sim swap'],
    brief: 'Attackers obtain and reuse valid usernames and passwords — via reuse, stuffing, spraying, or theft — to log in as a legitimate user. Because the access looks authorized, detection depends on anomaly monitoring and strong multi-factor authentication.',
  },
  {
    id: 'insider-threat',
    name: 'Insider Threat',
    keywords: ['insider', 'disgruntled', 'employee theft', 'privilege abuse', 'rogue employee', 'malicious insider', 'departing'],
    brief: 'A current or former employee, contractor, or partner misuses authorized access — whether maliciously or negligently — to steal data, sabotage systems, or enable an outside attacker. Trusted access makes insiders uniquely damaging and hard to detect.',
  },
  {
    id: 'ddos',
    name: 'Distributed Denial of Service (DDoS)',
    keywords: ['ddos', 'denial of service', 'dos attack', 'botnet flood', 'volumetric', 'service outage attack', 'system disruption', 'platform outage'],
    brief: 'A flood of traffic from many sources overwhelms a service, network, or application so legitimate users cannot reach it. Losses come mainly from downtime, degraded performance, and the cost of mitigation capacity.',
  },
  {
    id: 'data-breach',
    name: 'Data Breach / Exfiltration',
    keywords: ['data breach', 'exfiltration', 'data theft', 'data leak', 'pii exposure', 'database dump', 'records exposed', 'data exposure', 'records breach', 'records exposure', 'database breach', 'information breach', 'data loss', 'card data'],
    brief: 'Sensitive information — personal, financial, health, or proprietary — is accessed or copied without authorization. Costs include notification, regulatory fines, litigation, and long-tail reputational and identity-protection expenses.',
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Compromise',
    keywords: ['supply chain', 'supply-chain', 'software supply', 'dependency', 'compromised update', 'poisoned package', 'build system'],
    brief: 'Attackers compromise a trusted software vendor, library, or update mechanism so that malicious code reaches many downstream victims at once. The trust in the supplier is exactly what makes these attacks so far-reaching.',
  },
  {
    id: 'malware',
    name: 'Malware / Trojan Infection',
    keywords: ['malware', 'trojan', 'virus', 'worm', 'spyware', 'rootkit', 'backdoor', 'infostealer', 'malvertising'],
    brief: 'Malicious software installed on endpoints or servers to steal data, maintain persistence, or enable further attacks. It arrives through phishing, drive-by downloads, removable media, or compromised software.',
  },
  {
    id: 'web-app-attack',
    name: 'Web Application Attack',
    keywords: ['sql injection', 'sqli', 'xss', 'cross-site', 'web application', 'api abuse', 'injection attack', 'owasp', 'skimming', 'magecart'],
    brief: 'Exploitation of flaws in web applications or APIs — such as injection, cross-site scripting, or broken access control — to read data, run commands, or hijack sessions. Public exposure makes web apps a constant target.',
  },
  {
    id: 'cloud-misconfiguration',
    name: 'Cloud Misconfiguration / Exposure',
    keywords: ['cloud misconfig', 's3 bucket', 'exposed storage', 'misconfiguration', 'open bucket', 'iam misconfig', 'public bucket', 'cloud'],
    brief: 'Insecure cloud settings — public storage buckets, over-permissive IAM roles, unprotected databases — expose data or infrastructure without any "attack" beyond discovery. These are among the most common causes of large accidental exposures.',
  },
  {
    id: 'ot-cyber-physical',
    name: 'OT / Cyber-Physical Systems Intrusion',
    keywords: ['ot network', 'operational technology', 'scada', 'industrial control', 'cyber-physical', 'control tampering', 'water control', 'medical device', 'smart building', 'building systems', 'metering', 'refrigeration', 'telematics', 'radio', 'paging'],
    brief: 'An intrusion into operational technology — industrial control systems, SCADA, building automation, connected medical devices, vehicle telematics, or responder communications — where the consequence is physical: halted production, disrupted utilities, unsafe conditions. OT prioritizes availability and safety over confidentiality, runs long-lived hard-to-patch equipment, and is usually reached through the IT network, remote access, or a vendor connection.',
  },
  {
    id: 'apt-nation-state',
    name: 'Advanced Persistent Threat (Nation-State)',
    keywords: ['apt', 'nation-state', 'nation state', 'advanced persistent', 'state-sponsored', 'cyber espionage'],
    brief: 'A well-resourced, patient adversary — often state-sponsored — establishes long-term, stealthy access to steal intelligence or intellectual property, or to pre-position for disruption. Detection and eviction can take months.',
  },
  {
    id: 'physical-theft',
    name: 'Physical Theft / Loss of Device',
    keywords: ['physical theft', 'lost laptop', 'stolen device', 'lost device', 'stolen laptop', 'lost drive', 'hardware theft'],
    brief: 'Loss or theft of laptops, phones, drives, or backup media exposes whatever data they hold. Encryption at rest is the primary control that turns a potential breach into a non-event.',
  },
  {
    id: 'social-engineering',
    name: 'Social Engineering',
    keywords: ['social engineering', 'pretexting', 'impersonation', 'baiting', 'tailgating', 'help desk fraud'],
    brief: 'Manipulating people — by phone, in person, or online — into breaking security procedures or revealing information. It underlies many other attack types and targets the human layer that technical controls cannot fully protect.',
  },
  {
    id: 'zero-day',
    name: 'Zero-Day Exploit',
    keywords: ['zero-day', 'zero day', '0-day', 'unpatched vulnerability', 'novel exploit', 'unknown vulnerability'],
    brief: 'Exploitation of a vulnerability unknown to the vendor (or unpatched in the wild), so no fix is yet available. Because defenders have no signature or patch, zero-days are prized by sophisticated attackers and hard to defend against.',
  },
  {
    id: 'mitm',
    name: 'Man-in-the-Middle / Interception',
    keywords: ['man-in-the-middle', 'man in the middle', 'mitm', 'interception', 'eavesdropping', 'session hijack', 'rogue wifi'],
    brief: 'An attacker secretly relays or alters communications between two parties who believe they are talking directly, capturing credentials or injecting data. Weak or absent transport encryption is the usual enabler.',
  },
  {
    id: 'cryptojacking',
    name: 'Cryptojacking',
    keywords: ['cryptojacking', 'cryptomining', 'coin miner', 'mining malware', 'crypto mining'],
    brief: 'Unauthorized use of an organization’s computing resources to mine cryptocurrency. Damage is usually indirect — degraded performance, higher cloud and energy bills — but it also signals that systems have been compromised.',
  },
  {
    id: 'payment-fraud',
    name: 'Wire / Payment Fraud',
    keywords: ['payment fraud', 'wire transfer', 'financial fraud', 'fraudulent payment', 'ach fraud', 'card fraud', 'invoice manipulation', 'payroll', 'payment system', 'fraud'],
    brief: 'Fraudulent redirection or initiation of payments — altered bank details, fake invoices, or manipulated transfers. It often overlaps with business email compromise but can also stem from compromised finance systems.',
  },
  {
    id: 'third-party-breach',
    name: 'Third-Party / Vendor Breach',
    keywords: ['third-party breach', 'third party breach', 'vendor breach', 'partner breach', 'service provider', 'outsourced breach', 'third-party', 'third party', 'vendor portal', 'processor'],
    brief: 'A breach at a vendor, contractor, or service provider exposes your data or provides a path into your environment. Your risk depends on partners’ controls, making vendor due diligence and contractual safeguards essential.',
  },
  {
    id: 'destructive-attack',
    name: 'Destructive / Wiper Attack',
    keywords: ['wiper', 'destructive', 'sabotage', 'data destruction', 'defacement', 'firmware attack'],
    brief: 'An attack whose goal is damage rather than theft or ransom — wiping data, corrupting firmware, or destroying systems. Often tied to hacktivism or geopolitical conflict, recovery hinges on tested, offline backups.',
  },
];

// Fallback when a scenario name matches none of the catalog terms. Kept separate
// from the 20 so it never wins a tie; the UI can present it as "unclassified".
export const OTHER_COMPROMISE = {
  id: 'other',
  name: 'General / Unclassified',
  keywords: [],
  brief: 'This scenario didn’t match a specific compromise type from its name. Rename it to include a recognizable term (for example "ransomware", "phishing", or "business email compromise"), or treat it as a general loss-event scenario.',
};

// Classify a scenario into one compromise type from its name (falling back to a
// light look at asset/threat/effect only to break ties). Deterministic and
// offline — no AI. Returns a catalog entry, or OTHER_COMPROMISE when nothing
// matches. `matched` is true only when a real type was identified.
export function classifyCompromise(scenario) {
  const name = String(scenario?.name || '').toLowerCase();
  const context = [scenario?.threat, scenario?.effect, scenario?.asset]
    .map((s) => String(s || '').toLowerCase())
    .join(' ');

  let best = null;
  let bestScore = 0;
  for (const type of COMPROMISE_TYPES) {
    let score = 0;
    for (const kw of type.keywords) {
      // A hit in the name is worth far more than one in the surrounding fields.
      if (name.includes(kw)) score += 10 + kw.length; // longer, more specific terms outrank generic ones
      else if (context.includes(kw)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  return best ? { ...best, matched: true } : { ...OTHER_COMPROMISE, matched: false };
}
