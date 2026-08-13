// Curated reference catalog of common risk treatments (security controls),
// used to ground the AI treatment-suggestion prompt and the search_fair_kb
// tool. Static reference content — English-only for now, like the compromise
// catalog (see the i18n note in src/lib/qcr/compromiseTypes.js).
//
// `typical_reductions` are PLANNING HEURISTICS, not measurements: rough
// fractional ranges by which a well-implemented control reduces each FAIR
// factor for the scenarios it fits, drawn from common FAIR practice. They
// exist so AI drafts start from a defensible anchor instead of a free
// invention; the analyst adjusts them to the environment before saving, and
// treatment economics are always recomputed from what is actually saved.
// Factors a control does not meaningfully affect are omitted.
//
// `frameworks` cite NIST CSF 2.0 categories, ISO/IEC 27001:2022 Annex A
// controls, and CIS Controls v8 so accepted treatments can reference a
// recognized catalog. `cost_notes` describe cost drivers, not dollars — cost
// scales with organization size and is the analyst's estimate to make.

export const CONTROL_CATALOG = [
  {
    id: 'phishing-resistant-mfa',
    name: 'Phishing-resistant MFA',
    keywords: ['mfa', 'multi-factor', 'authentication', 'passkeys', 'fido2', 'credential', 'account takeover', 'phishing', 'stuffing', 'password'],
    description: 'Hardware-key or passkey (FIDO2/WebAuthn) authentication on workforce and remote access. Unlike push or SMS codes, it cannot be proxied by adversary-in-the-middle kits or approved away under fatigue.',
    frameworks: ['NIST CSF 2.0 PR.AA-03', 'ISO/IEC 27001:2022 A.8.5', 'CIS Controls v8 6.3–6.5'],
    typical_reductions: { vulnerability: [0.5, 0.9] },
    effectiveness_notes: 'Strongest single control against credential theft, account takeover, and phished logins — it removes the reusable secret. Little effect on threat frequency (attempts continue) or on losses once a session is otherwise obtained.',
    cost_notes: 'Keys or platform passkey licensing per user, identity-provider integration, enrollment support; legacy protocols that bypass MFA are usually the hidden cost.',
  },
  {
    id: 'security-awareness-training',
    name: 'Security awareness training and phishing simulation',
    keywords: ['training', 'awareness', 'phishing simulation', 'social engineering', 'education', 'culture'],
    description: 'Recurring role-relevant training plus simulated phishing with follow-up coaching, aimed at recognition and — equally — fast reporting of lures that get through.',
    frameworks: ['NIST CSF 2.0 PR.AT-01', 'ISO/IEC 27001:2022 A.6.3', 'CIS Controls v8 14.1–14.9'],
    typical_reductions: { vulnerability: [0.2, 0.4] },
    effectiveness_notes: 'Moderately reduces the probability a phishing or social-engineering attempt succeeds; reporting speed also trims loss magnitude indirectly by shortening response time. Effects decay without reinforcement.',
    cost_notes: 'Platform subscription per user plus program time; the larger investment is keeping content fresh and non-punitive so reporting stays high.',
  },
  {
    id: 'edr-mdr',
    name: 'Endpoint detection and response (EDR/MDR)',
    keywords: ['edr', 'endpoint', 'detection', 'response', 'mdr', 'antivirus', 'malware', 'ransomware', 'behavioral'],
    description: 'Behavioral endpoint agents with containment (isolate host, kill process), optionally operated 24/7 by a managed provider (MDR).',
    frameworks: ['NIST CSF 2.0 DE.CM-01', 'ISO/IEC 27001:2022 A.8.7', 'CIS Controls v8 10.1, 13.2, 13.7'],
    typical_reductions: { vulnerability: [0.3, 0.6], primary_loss: [0.2, 0.4] },
    effectiveness_notes: 'Reduces the chance an intrusion reaches its objective (malware, ransomware, hands-on-keyboard) and shrinks blast radius by catching activity early. Value depends heavily on coverage completeness and whether alerts are watched around the clock.',
    cost_notes: 'Per-endpoint licensing; MDR service fees if staffed externally; internal triage time otherwise. Unmanaged or unsupported devices left outside coverage undermine the estimate.',
  },
  {
    id: 'immutable-backups',
    name: 'Immutable offline backups with tested restore',
    keywords: ['backup', 'immutable', 'offline', 'restore', 'recovery', 'ransomware', 'wiper', 'resilience', 'air gap'],
    description: 'Backups an attacker with domain-admin credentials cannot alter or delete (offline, air-gapped, or object-lock immutable), with restore times validated by exercise rather than assumed.',
    frameworks: ['NIST CSF 2.0 PR.DS-11, RC.RP-03', 'ISO/IEC 27001:2022 A.8.13', 'CIS Controls v8 11.1–11.5'],
    typical_reductions: { primary_loss: [0.4, 0.7] },
    effectiveness_notes: 'The decisive control on ransomware and destructive-attack loss magnitude: it converts "pay or rebuild from nothing" into a bounded restore effort. Does not prevent the event, and does not address exfiltration-driven secondary loss.',
    cost_notes: 'Storage and backup tooling scale with data volume; the often-skipped cost is periodic full-restore exercises, which is exactly what makes the loss-reduction estimate defensible.',
  },
  {
    id: 'vulnerability-patch-management',
    name: 'Vulnerability and patch management',
    keywords: ['patch', 'vulnerability management', 'scanning', 'remediation', 'exposure', 'cve', 'updates'],
    description: 'Continuous scanning with prioritized, SLA-bound remediation — fastest for internet-facing systems and known-exploited vulnerabilities.',
    frameworks: ['NIST CSF 2.0 ID.RA-01, PR.PS-02', 'ISO/IEC 27001:2022 A.8.8', 'CIS Controls v8 7.1–7.7'],
    typical_reductions: { vulnerability: [0.3, 0.6] },
    effectiveness_notes: 'Reduces the probability that exploitation attempts against known flaws succeed, and shortens the n-day window that drives most "zero-day" losses in practice. No effect on social-engineering paths.',
    cost_notes: 'Scanner licensing plus the real cost: engineering time to remediate on SLA and maintenance windows for disruptive patches.',
  },
  {
    id: 'network-segmentation',
    name: 'Network segmentation and lateral-movement controls',
    keywords: ['segmentation', 'lateral movement', 'zero trust', 'firewall', 'vlan', 'blast radius', 'ot', 'flat network'],
    description: 'Separating networks by function and sensitivity (including IT/OT boundaries) with controlled crossings, so one compromised host cannot reach everything.',
    frameworks: ['NIST CSF 2.0 PR.IR-01', 'ISO/IEC 27001:2022 A.8.22', 'CIS Controls v8 12.2, 3.12'],
    typical_reductions: { vulnerability: [0.1, 0.3], primary_loss: [0.3, 0.6] },
    effectiveness_notes: 'Primarily a loss-magnitude control: it caps how far ransomware, wipers, or an intruder spread, which shrinks per-event loss even when the event still happens. Modest vulnerability effect by blocking some attack paths outright.',
    cost_notes: 'Network engineering effort dominates; retrofitting a flat legacy network is a project, not a purchase. Maintenance cost is keeping rules meaningful as systems change.',
  },
  {
    id: 'payment-verification',
    name: 'Out-of-band payment verification and dual authorization',
    keywords: ['payment', 'wire', 'verification', 'callback', 'dual authorization', 'bec', 'invoice', 'banking', 'fraud', 'transfer'],
    description: 'Mandatory independent-channel verification (callback to a known number) for new or changed bank details, plus two-person authorization above a threshold — enforced with no executive exceptions.',
    frameworks: ['NIST CSF 2.0 GV.PO-01 (process control)', 'ISO/IEC 27001:2022 A.5.3 (segregation of duties)', 'CIS Controls v8 (process; no direct safeguard)'],
    typical_reductions: { vulnerability: [0.6, 0.9] },
    effectiveness_notes: 'The control that actually stops BEC and payment fraud: it breaks the single point of deception regardless of how convincing the email or caller is. Effectiveness is procedural — it collapses if exceptions are tolerated under urgency.',
    cost_notes: 'Near-zero tooling cost; the spend is process design, training, and friction on legitimate urgent payments. The estimate should reflect adherence, not policy existence.',
  },
  {
    id: 'email-security-gateway',
    name: 'Email security gateway with DMARC enforcement',
    keywords: ['email', 'gateway', 'filtering', 'dmarc', 'spf', 'dkim', 'spoofing', 'phishing', 'attachment', 'sandbox'],
    description: 'Advanced inbound filtering (URL rewriting, attachment detonation, impersonation detection) plus DMARC at enforcement so the organization\'s own domain cannot be spoofed.',
    frameworks: ['NIST CSF 2.0 PR.PS-05', 'ISO/IEC 27001:2022 A.5.14, A.8.23', 'CIS Controls v8 9.1–9.7'],
    typical_reductions: { frequency: [0.2, 0.5], vulnerability: [0.1, 0.3] },
    effectiveness_notes: 'One of the few controls that reduces threat event frequency as experienced by users — lures are blocked before arrival. Residual sophisticated lures still get through, so it pairs with training and MFA rather than replacing them.',
    cost_notes: 'Per-mailbox licensing; DMARC enforcement requires an inventory of legitimate sending services, which is the real project.',
  },
  {
    id: 'ddos-protection',
    name: 'DDoS protection and traffic scrubbing',
    keywords: ['ddos', 'scrubbing', 'cdn', 'anycast', 'volumetric', 'availability', 'flood', 'denial'],
    description: 'Always-on or on-demand upstream mitigation (CDN/anycast absorption, scrubbing centers) in front of public services, with application-layer rules for request floods.',
    frameworks: ['NIST CSF 2.0 PR.IR-04', 'ISO/IEC 27001:2022 A.8.6', 'CIS Controls v8 (network architecture; no direct safeguard)'],
    typical_reductions: { vulnerability: [0.7, 0.95] },
    effectiveness_notes: 'Against volumetric and most protocol attacks, competent upstream mitigation reduces the probability of a user-visible outage to near zero — among the largest single-control effects in this catalog. Application-layer floods need tuned rules and show smaller reductions.',
    cost_notes: 'Subscription scales with clean-traffic volume and protected surface; on-demand plans are cheaper but concede minutes of outage while mitigation engages.',
  },
  {
    id: 'privileged-access-management',
    name: 'Least privilege and privileged access management',
    keywords: ['least privilege', 'pam', 'privileged', 'admin', 'iam', 'access review', 'service accounts', 'insider'],
    description: 'Vaulted, checked-out, session-recorded administrative credentials; standing privileges cut to least-necessary; periodic access reviews and fast deprovisioning on role change or exit.',
    frameworks: ['NIST CSF 2.0 PR.AA-05', 'ISO/IEC 27001:2022 A.8.2', 'CIS Controls v8 5.4, 6.8'],
    typical_reductions: { vulnerability: [0.2, 0.4], primary_loss: [0.2, 0.4] },
    effectiveness_notes: 'Cuts both the chance a stolen or misused account reaches critical systems and the damage available to whoever holds it — including insiders. Session recording adds deterrence and shortens investigations.',
    cost_notes: 'PAM tooling plus meaningful workflow change for administrators; the recurring cost is keeping reviews honest rather than rubber-stamped.',
  },
  {
    id: 'cloud-security-posture',
    name: 'Cloud security posture management and guardrails',
    keywords: ['cspm', 'cloud', 'misconfiguration', 'bucket', 'iam', 'guardrails', 'posture', 'public access', 'drift'],
    description: 'Continuous configuration monitoring against policy, org-level preventive guardrails (public-access blocks, mandatory encryption), and auto-remediation for the worst misconfigurations.',
    frameworks: ['NIST CSF 2.0 ID.RA-01, PR.PS-01', 'ISO/IEC 27001:2022 A.8.9', 'CIS Controls v8 4.1–4.7'],
    typical_reductions: { frequency: [0.3, 0.6], vulnerability: [0.4, 0.7] },
    effectiveness_notes: 'For accidental-exposure scenarios the preventive guardrails reduce event frequency directly (the misconfiguration can\'t be created), while detection shortens exposure windows and thus record counts for what slips through.',
    cost_notes: 'CSPM licensing per cloud account/workload; engineering time to triage findings and to retrofit guardrails without breaking deployments.',
  },
  {
    id: 'device-encryption',
    name: 'Full-disk encryption with managed device fleet',
    keywords: ['encryption', 'full-disk', 'bitlocker', 'filevault', 'laptop', 'device', 'theft', 'lost', 'mobile', 'remote wipe'],
    description: 'Verified full-disk encryption across the fleet, enforced and attested through device management, with remote-wipe and short auto-lock as backstops.',
    frameworks: ['NIST CSF 2.0 PR.DS-01', 'ISO/IEC 27001:2022 A.8.24, A.7.9', 'CIS Controls v8 3.6, 3.9'],
    typical_reductions: { primary_loss: [0.7, 0.95], secondary_loss: [0.7, 0.95] },
    effectiveness_notes: 'Converts device loss or theft from a reportable data breach into a hardware replacement — close to eliminating the loss magnitude of that scenario. No effect on how often devices are lost; regulators treat its absence as an aggravating factor.',
    cost_notes: 'Mostly built into modern OS licensing; the cost is device-management coverage and attestation so "encrypted" is verified per device, not assumed.',
  },
  {
    id: 'third-party-risk-management',
    name: 'Third-party risk management and vendor access controls',
    keywords: ['vendor', 'third party', 'supplier', 'due diligence', 'contract', 'supply chain', 'assessment', 'vendor access'],
    description: 'Tiered vendor due diligence, contractual security and breach-cost clauses, and — for connected vendors — least-privilege segmented access with monitored sessions instead of standing VPN accounts.',
    frameworks: ['NIST CSF 2.0 GV.SC-01–07', 'ISO/IEC 27001:2022 A.5.19–5.22', 'CIS Controls v8 15.1–15.7'],
    typical_reductions: { frequency: [0.1, 0.3], vulnerability: [0.2, 0.4], secondary_loss: [0.2, 0.4] },
    effectiveness_notes: 'Modest but broad: fewer risky vendors and less standing access trim event frequency and the chance a vendor compromise reaches you; contract clauses shift part of the loss back to the vendor — recovery under them is neither immediate nor certain.',
    cost_notes: 'Program staffing and assessment tooling; legal effort on contracts. Scales with vendor count, which is why tiering by data sensitivity matters.',
  },
  {
    id: 'incident-response-program',
    name: 'Incident response plan, retainer, and exercises',
    keywords: ['incident response', 'ir plan', 'retainer', 'tabletop', 'exercise', 'playbook', 'crisis', 'forensics'],
    description: 'Maintained response playbooks, a pre-contracted forensics/IR retainer, defined decision authority, and regular tabletop exercises including executives.',
    frameworks: ['NIST CSF 2.0 RS.MA-01', 'ISO/IEC 27001:2022 A.5.24–5.26', 'CIS Controls v8 17.1–17.9'],
    typical_reductions: { primary_loss: [0.2, 0.4], secondary_loss: [0.2, 0.4] },
    effectiveness_notes: 'A pure loss-magnitude control: faster, practiced response shortens outages, contains spread, and reduces the notification, legal, and reputational tail. Breach-cost research consistently associates tested IR with materially lower totals.',
    cost_notes: 'Retainer fees (often creditable against use), exercise time across teams; cheap relative to the loss factors it moves.',
  },
  {
    id: 'centralized-logging-monitoring',
    name: 'Centralized logging and 24/7 security monitoring',
    keywords: ['siem', 'logging', 'monitoring', 'soc', 'detection', 'alerting', 'dwell time', 'anomaly'],
    description: 'Central log collection across identity, endpoint, network, and cloud with correlation and around-the-clock triage — in-house SOC or managed service.',
    frameworks: ['NIST CSF 2.0 DE.CM-01–09, DE.AE-02', 'ISO/IEC 27001:2022 A.8.15, A.8.16', 'CIS Controls v8 8.1–8.11, 13.1'],
    typical_reductions: { vulnerability: [0.2, 0.4], primary_loss: [0.1, 0.3] },
    effectiveness_notes: 'Shortens dwell time, which cuts both the chance an intrusion completes (vulnerability) and how much is lost before containment. Also what makes several other controls\' estimates credible — unmonitored alerts reduce nothing.',
    cost_notes: 'Ingest-based licensing grows with log volume; staffing an internal 24/7 rotation is the dominant cost and why many organizations buy it as a service.',
  },
  {
    id: 'secure-sdlc-waf',
    name: 'Application security program (secure SDLC, testing, WAF)',
    keywords: ['appsec', 'sdlc', 'code review', 'penetration test', 'waf', 'api security', 'injection', 'web application', 'dependency'],
    description: 'Security requirements and review in development, dependency and static/dynamic scanning in CI, periodic penetration testing, and a tuned WAF in front of public applications and APIs.',
    frameworks: ['NIST CSF 2.0 PR.PS-06', 'ISO/IEC 27001:2022 A.8.25–8.29', 'CIS Controls v8 16.1–16.14'],
    typical_reductions: { vulnerability: [0.3, 0.6] },
    effectiveness_notes: 'Reduces the probability that a serious exploitable flaw exists in internet-facing applications and buys response time (WAF virtual patching) when one is disclosed. Loss magnitude is set by the data behind the app, which this program does not change.',
    cost_notes: 'Tooling is modest; developer time for remediation and testing cadence dominates. WAF tuning is recurring, not one-time.',
  },
  {
    id: 'help-desk-identity-verification',
    name: 'Help-desk identity verification procedures',
    keywords: ['help desk', 'verification', 'reset', 'vishing', 'impersonation', 'social engineering', 'callback', 'service desk'],
    description: 'Strict identity proofing before password resets or MFA re-enrollment — callbacks to numbers on record, manager confirmation for privileged accounts, and no exceptions for urgency or seniority.',
    frameworks: ['NIST CSF 2.0 PR.AA-01', 'ISO/IEC 27001:2022 A.5.16', 'CIS Controls v8 6.1, 6.2'],
    typical_reductions: { vulnerability: [0.4, 0.7] },
    effectiveness_notes: 'Directly closes the help-desk reset path used in recent high-profile social-engineering intrusions. Cheap and effective, but only as strong as agents\' willingness to refuse a fluent, pressuring caller — script it and rehearse it.',
    cost_notes: 'Process and training cost only; adds handle time per reset. Verification data (numbers on record) must be maintained to stay usable.',
  },
  {
    id: 'cyber-insurance',
    name: 'Cyber insurance',
    keywords: ['insurance', 'transfer', 'premium', 'coverage', 'policy', 'deductible', 'risk transfer'],
    description: 'Risk transfer for response costs, business interruption, and liability — increasingly conditioned on the insured maintaining baseline controls (MFA, EDR, backups).',
    frameworks: ['NIST CSF 2.0 GV.RM-07 (risk transfer)', 'ISO/IEC 27005 (risk treatment: sharing)', 'CIS Controls v8 (not applicable — financial control)'],
    typical_reductions: { primary_loss: [0.3, 0.6], secondary_loss: [0.3, 0.6] },
    effectiveness_notes: 'Changes who pays rather than what happens: reduces net financial loss after deductibles, sub-limits, and exclusions (war/state-actor clauses matter for destructive scenarios). Model the reduction against covered categories only, not the gross estimate.',
    cost_notes: 'Premium plus deductible retention; premiums track the control baseline, so it pairs naturally with — and effectively discounts — the other treatments here.',
  },
];

export function findControlById(id) {
  return CONTROL_CATALOG.find((control) => control.id === id) || null;
}
