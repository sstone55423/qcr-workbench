// Curated knowledge base backing the "Learn more" screen: for each of the 21
// compromise types in compromiseTypes.js, a deeper write-up (`inDepth`) and a few widely
// reported real-world incidents (`incidents`). Static reference content — no
// AI, no network — retrieved by compromise-type id and searchable through
// src/lib/qcr/retrieval.js (and the search_fair_kb MCP tool).
//
// Like the catalog briefs, this is English reference content and intentionally
// not routed through i18n (see the note in compromiseTypes.js). Incident
// summaries are compressed from public reporting; treat them as pointers for
// further reading, not as citable loss data.
//
// Writing conventions: `inDepth` is two paragraphs — first how the compromise
// actually unfolds, second how it maps onto FAIR factors (what drives
// frequency, vulnerability, and primary/secondary loss) so the reader can
// carry it straight into the estimate steps. `incidents` entries are
// {name, year, summary}; `year` is a string so ranges like "2013–2015" work.

export const KNOWLEDGE_BASE = [
  {
    typeId: 'business-email-compromise',
    inDepth: [
      'Most BEC losses start weeks before the fraudulent payment request. Attackers phish or buy access to a real mailbox, sit silently reading correspondence, and learn the rhythm of invoices, approvals, and vendor relationships. The strike is then timed to a real transaction: a genuine invoice resent from a lookalike domain with new bank details, or an "urgent and confidential" request that mimics an executive\'s writing style. Because no malware is involved and the messages often come from legitimate accounts, email security gateways rarely flag anything.',
      'In FAIR terms, threat event frequency scales with how many payments an organization makes and how publicly its vendor and staff relationships are visible; seasonal spikes (real-estate closings, tuition cycles, harvest or auction seasons) concentrate attempts. Vulnerability is dominated by process, not technology: whether out-of-band verification of banking changes is mandatory and actually followed. Primary loss is the diverted amount net of whatever banks claw back — recovery odds fall sharply after the first 48 hours. Secondary loss covers strained vendor relationships, legal fees, and occasionally regulatory scrutiny of the controls that failed.',
    ],
    incidents: [
      { name: 'Facebook and Google invoice fraud', year: '2013–2015', summary: 'A Lithuanian fraudster invoiced both companies while impersonating hardware supplier Quanta Computer, collecting about $121 million before arrest; roughly half was recovered.' },
      { name: 'Ubiquiti Networks vendor-impersonation fraud', year: '2015', summary: 'Finance staff at a subsidiary were deceived into wiring $46.7 million to overseas accounts controlled by impostors posing as a vendor and executives.' },
      { name: 'Toyota Boshoku subsidiary fraud', year: '2019', summary: 'Attackers posing as a business partner persuaded a European subsidiary of the Toyota supplier to change payment details, diverting about ¥4 billion (~$37 million).' },
    ],
  },
  {
    typeId: 'ransomware',
    inDepth: [
      'Modern ransomware is an ecosystem, not a single program: initial-access brokers sell footholds gained through phishing, exposed remote-desktop services, or unpatched edge devices; affiliates of ransomware-as-a-service operations then escalate privileges, disable backups and security tooling, exfiltrate data, and only then detonate encryption across as many systems as possible — often at night or before a holiday weekend. "Double extortion" (pay or the stolen data is leaked) means even organizations with good backups still face a ransom decision.',
      'For FAIR estimates, threat event frequency for opportunistic ransomware tracks the exposed attack surface (remote access, email volume, unpatched perimeter), while vulnerability turns on segmentation, endpoint detection, offline backups, and how fast encryption can spread once inside. Primary loss is dominated by downtime and rebuild effort — frequently a larger number than any ransom — plus incident response and, sometimes, the payment itself. Secondary loss enters when data was exfiltrated: notification, credit monitoring, regulatory penalties, and litigation, which is why the secondary-loss probability estimate matters so much for this type.',
    ],
    incidents: [
      { name: 'WannaCry', year: '2017', summary: 'A self-propagating ransomware worm exploiting a Windows SMB flaw disrupted hundreds of thousands of systems in over 150 countries, including large parts of the UK National Health Service.' },
      { name: 'Colonial Pipeline', year: '2021', summary: 'A DarkSide affiliate entered through a legacy VPN account without MFA; the company shut down the largest US fuel pipeline for days and paid a $4.4 million ransom, part of which was later recovered.' },
      { name: 'Change Healthcare', year: '2024', summary: 'ALPHV/BlackCat ransomware halted claims processing across much of the US healthcare system; UnitedHealth paid a $22 million ransom and reported total response costs in the billions.' },
    ],
  },
  {
    typeId: 'phishing',
    inDepth: [
      'Phishing spans a spectrum from mass-mailed credential lures to laboriously researched spear phishing against a handful of targets. Current campaigns increasingly bypass passwords entirely: adversary-in-the-middle kits proxy the real login page and capture session tokens after MFA, while "MFA fatigue" attacks bombard users with push prompts until one is approved. SMS (smishing) and voice (vishing) variants move the lure to channels with even fewer technical controls.',
      'As a FAIR factor, threat event frequency is high and largely outside the organization\'s control — nearly everyone is targeted continuously — so scenarios usually define the threat event as "a user receives and engages with a lure." Vulnerability reflects training, phishing-resistant MFA (hardware keys defeat proxy kits; push approval does not), and mail filtering. Primary loss for a standalone phishing scenario is usually modest (response and remediation); the large numbers appear when phishing is modeled as the entry point of a chained scenario — ransomware, BEC, or data breach — which argues for scoping assumptions that say clearly where this scenario ends and the next begins.',
    ],
    incidents: [
      { name: 'RSA SecurID breach', year: '2011', summary: 'A spreadsheet attachment titled "2011 Recruitment plan" carried a zero-day exploit to a small group of employees; the resulting intrusion compromised SecurID token seeds used by defense contractors.' },
      { name: 'DNC spear phishing', year: '2016', summary: 'A fake Google security alert led a campaign official to enter credentials on an attacker page, exposing years of email later leaked during the US presidential election.' },
      { name: 'Twilio and the "0ktapus" campaign', year: '2022', summary: 'SMS lures impersonating IT and Okta login pages harvested employee credentials at over 130 companies; at Twilio the attackers reached internal tools and customer data.' },
    ],
  },
  {
    typeId: 'credential-theft',
    inDepth: [
      'Billions of username-password pairs from past breaches circulate freely, and infostealer malware adds fresh ones daily — including session cookies that can bypass MFA entirely. Credential stuffing tools replay these lists against login pages at scale, hiding behind residential proxy networks; password spraying tries a few common passwords across many accounts to stay under lockout thresholds. Once inside, the attacker is indistinguishable from the legitimate user until behavior gives them away.',
      'Threat event frequency for internet-facing login surfaces is effectively continuous, so useful FAIR scenarios usually count successful takeovers or campaigns rather than raw attempts. Vulnerability hinges on password reuse across the user population, MFA coverage (especially on legacy protocols and service accounts that often lack it), and anomaly detection on logins. Primary loss follows what the compromised accounts can reach — fraud, data access, cloud resources — and secondary loss grows steeply when customer accounts rather than employee accounts are taken over, because notification and support costs scale with the affected population.',
    ],
    incidents: [
      { name: 'Zoom credential stuffing', year: '2020', summary: 'Over half a million Zoom accounts assembled from prior-breach password reuse were offered on criminal forums during the pandemic surge in remote work.' },
      { name: '23andMe', year: '2023', summary: 'Credential stuffing compromised about 14,000 accounts directly, but DNA-relative sharing features exposed profile data of roughly 6.9 million users, triggering litigation and a $30 million settlement.' },
      { name: 'Snowflake customer breaches', year: '2024', summary: 'Infostealer-harvested credentials without MFA gave attackers access to numerous Snowflake customer tenants, including Ticketmaster and AT&T call records affecting tens of millions.' },
    ],
  },
  {
    typeId: 'insider-threat',
    inDepth: [
      'Insider incidents split into three patterns with different dynamics: malicious insiders who steal data or sabotage systems (often around resignation, termination, or a grievance); negligent insiders whose shortcuts — misdirected email, disabled controls, shadow IT — create exposure without intent; and compromised insiders whose credentials or devices are hijacked by outsiders. Departing employees taking "their" work product to a competitor is by far the most common malicious variant, and it concentrates in the two weeks either side of giving notice.',
      'FAIR modeling benefits from picking one pattern per scenario rather than "insiders" generally. Frequency estimates can anchor on workforce size, turnover rate, and privileged-user count; vulnerability reflects least-privilege enforcement, offboarding speed, and monitoring of exfiltration channels (personal cloud storage, email forwarding, USB). Primary loss for sabotage is recovery and downtime; for IP theft it is the harder-to-bound competitive value of what left. Secondary loss frequently includes litigation — both pursuing the insider and defending claims — and disclosure obligations if personal data was involved.',
    ],
    incidents: [
      { name: 'Waymo–Levandowski trade-secret theft', year: '2016', summary: 'An engineer downloaded ~14,000 files on self-driving technology before leaving to found a startup acquired by Uber; the dispute ended in a $245 million settlement and a criminal conviction.' },
      { name: 'Tesla insider sabotage claims', year: '2018', summary: 'Tesla alleged a disgruntled technician altered manufacturing-system code and exported gigabytes of data to outsiders after being passed over for promotion.' },
      { name: 'Twitter insiders spying for Saudi Arabia', year: '2019', summary: 'Two employees were charged with using internal tools to pull private account data on dissidents and critics on behalf of the Saudi government.' },
    ],
  },
  {
    typeId: 'ddos',
    inDepth: [
      'DDoS attacks come in three flavors that stress different layers: volumetric floods that saturate bandwidth (now routinely hundreds of gigabits, powered by botnets of routers and IoT devices), protocol attacks that exhaust firewalls and load balancers, and application-layer attacks that look like legitimate requests while overwhelming the backend. Amplification techniques bounce small spoofed queries off open servers to multiply traffic hundreds of times, and booter services rent all of this by the hour for a few dollars. Extortion variants ("pay or we continue") add a ransom dynamic.',
      'For FAIR, threat event frequency varies enormously by sector visibility — gaming, finance, education during exam windows, and anyone geopolitically exposed see far more attempts — and by whether the organization has been targeted before. Vulnerability is essentially a question of absorbed capacity: upstream scrubbing or CDN protection can shrink the probability that an attempt becomes an outage to near zero, which is why this scenario often shows dramatic treatment effects. Primary loss is downtime revenue and mitigation cost; secondary loss (SLA credits, customer churn, reputational coverage) depends on how customer-facing the disrupted service is.',
    ],
    incidents: [
      { name: 'Dyn DNS attack', year: '2016', summary: 'The Mirai IoT botnet flooded DNS provider Dyn, knocking Twitter, Netflix, Reddit, and much of the US East Coast internet offline for hours.' },
      { name: 'GitHub memcached amplification', year: '2018', summary: 'A then-record 1.35 Tbps amplification attack hit GitHub, which stayed up after traffic was rerouted through a scrubbing provider within minutes.' },
      { name: 'HTTP/2 "Rapid Reset" attacks', year: '2023', summary: 'A protocol flaw let comparatively small botnets generate hundreds of millions of requests per second against Google, Cloudflare, and AWS — the largest application-layer attacks recorded.' },
    ],
  },
  {
    typeId: 'data-breach',
    inDepth: [
      'A data breach is an outcome with many roads in — stolen credentials, an unpatched application, a misconfigured store, an insider — so a good scenario names the road it is modeling. What the breach costs depends most on what was taken and how much of it: regulated personal, health, or payment data carries per-record notification and monitoring duties, while intellectual-property theft may have no disclosure duty but larger strategic cost. Discovery is often slow; dwell times of months mean the exposure window, not the intrusion moment, drives the record count.',
      'In FAIR estimates, the loss-magnitude side deserves most of the effort. Primary loss covers investigation, containment, and notification mechanics; secondary loss — regulatory fines (GDPR, HIPAA, state AGs), class-action litigation, credit monitoring, and customer churn — usually dominates and scales with record count and data sensitivity, which makes the secondary-loss-probability factor pivotal. Published per-record cost averages compress wildly different breaches into one number; anchoring estimates on the organization\'s own record counts, contractual penalties, and regulator exposure produces more defensible ranges.',
    ],
    incidents: [
      { name: 'Equifax', year: '2017', summary: 'An unpatched Apache Struts flaw exposed personal data of about 147 million people; settlements and remediation exceeded $1.4 billion and reshaped US breach-accountability expectations.' },
      { name: 'Marriott / Starwood', year: '2018', summary: 'Attackers had been inside the acquired Starwood reservation system since 2014, exposing up to 383 million guest records and drawing a UK GDPR fine.' },
      { name: 'National Public Data', year: '2024', summary: 'A background-check aggregator leaked billions of rows including Social Security numbers; the company faced nationwide litigation and filed for bankruptcy within months.' },
    ],
  },
  {
    typeId: 'supply-chain',
    inDepth: [
      'Supply-chain compromise weaponizes trust: a poisoned software update, a malicious package slipped into an open-source registry, a compromised build server signing malware with a legitimate certificate. One intrusion at the supplier fans out to every downstream customer that installs the update, which is why these attacks attract the most patient, well-resourced adversaries — and why detection often comes from a downstream victim, long after distribution.',
      'FAIR scenarios here model the organization as the downstream victim: threat event frequency is a function of how many critical suppliers and software dependencies exist and how attractive they are as multipliers, making a dependency inventory (SBOM) the practical starting point for the estimate. Vulnerability reflects how quickly updates are adopted without validation, whether vendor access into the environment is segmented, and egress monitoring that might catch a beacon. Primary loss covers investigation and eviction — expensive because trusted channels were abused — while secondary loss depends on whether customer data or systems were reachable through the compromised component.',
    ],
    incidents: [
      { name: 'SolarWinds Orion', year: '2020', summary: 'A trojanized update signed by the vendor reached ~18,000 organizations; Russian state actors then hand-picked US agencies and tech firms for follow-on espionage.' },
      { name: 'Kaseya VSA', year: '2021', summary: 'REvil exploited the remote-management platform to push ransomware through managed service providers to roughly 1,500 downstream businesses in one weekend.' },
      { name: 'xz Utils backdoor', year: '2024', summary: 'A years-long social-engineering campaign inserted a backdoor into a core Linux compression library; a Microsoft engineer noticed odd SSH latency and caught it weeks before broad distribution.' },
    ],
  },
  {
    typeId: 'malware',
    inDepth: [
      'Commodity malware operates as a layered economy: loaders and botnets establish the first foothold and then sell that access onward; banking trojans and infostealers monetize directly by harvesting credentials, cookies, and wallets; remote-access trojans give hands-on-keyboard control. Delivery follows whatever users will open — email attachments, cracked software, malicious ads, fake browser updates — and modern strains disable security tooling and establish several persistence mechanisms within minutes of landing.',
      'Because "malware infection" is broad, FAIR scenarios work better scoped to a consequence: an infostealer harvesting credentials has a very different loss profile from a RAT enabling fraud. Threat event frequency tracks user count and exposure (email volume, browsing, personal-device use); vulnerability reflects endpoint protection coverage, application allow-listing, and patch cadence. Primary loss for contained infections is cleanup and short downtime — the estimates get interesting when the scenario models what the malware enables next, and scoping assumptions should say whether those follow-on losses are counted here or in a separate chained scenario.',
    ],
    incidents: [
      { name: 'Zeus banking trojan', year: '2007–2010', summary: 'The dominant credential-stealing trojan of its era drained an estimated $70 million+ from business bank accounts via harvested online-banking logins and money mules.' },
      { name: 'Emotet takedown', year: '2021', summary: 'The "world\'s most dangerous botnet," which evolved from banking trojan to malware-delivery platform for ransomware gangs, was dismantled in a coordinated eight-country law-enforcement action.' },
      { name: 'RedLine Stealer disruption', year: '2024', summary: 'Operation Magnus seized infrastructure of RedLine and Meta infostealers, which had harvested hundreds of millions of credentials later used in major breaches, including the Snowflake customer attacks.' },
    ],
  },
  {
    typeId: 'web-app-attack',
    inDepth: [
      'Public web applications and APIs are probed constantly by automated scanners, so any exploitable flaw will eventually be found. The perennial offenders are injection (SQL commands smuggled through input fields), broken access control (changing an ID in a URL to see someone else\'s data), and authentication weaknesses; APIs add their own failure modes, especially unauthenticated endpoints and excessive data exposure that only surface when someone enumerates them at scale. A single flaw in an internet-facing app can yield the entire backing database.',
      'For FAIR, threat event frequency against anything internet-facing is high but mostly automated and low-skill; the estimate that matters is vulnerability — the probability a serious exploitable flaw exists and is found — which reflects secure development practice, dependency patching, testing cadence, and whether a WAF buys time. Primary loss covers incident response and service disruption; secondary loss follows the data behind the app, so an attack on a brochure site and one on a customer portal deserve separate scenarios even though the technique is identical.',
    ],
    incidents: [
      { name: 'TalkTalk SQL injection', year: '2015', summary: 'Teenage attackers used SQL injection against legacy web pages to access ~157,000 customer records; the UK telecom lost about £60 million and 100,000 customers, and was fined for inadequate security.' },
      { name: 'Optus API breach', year: '2022', summary: 'An unauthenticated API endpoint exposed personal data of nearly 10 million Australians, including passport and license numbers, prompting national identity-document reissuance.' },
      { name: 'MOVEit Transfer exploitation', year: '2023', summary: 'The Cl0p gang mass-exploited a SQL-injection zero-day in the file-transfer product, stealing data from over 2,700 organizations, from payroll processors to government agencies.' },
    ],
  },
  {
    typeId: 'cloud-misconfiguration',
    inDepth: [
      'Cloud platforms make world-readable one checkbox away: storage buckets, snapshot shares, unauthenticated databases, and over-broad IAM roles expose data with no exploit required — automated scanners find newly public resources within hours. The subtler variant is privilege sprawl: a compromised workload or leaked key inherits permissions nobody remembers granting, and identity misconfigurations turn a small foothold into tenant-wide access. Infrastructure-as-code copies the same mistake across every environment it deploys.',
      'FAIR scenarios should separate accidental exposure (misconfiguration discovered by scanners or researchers — frequency driven by change volume and configuration-review discipline) from exploited misconfiguration (an attacker leveraging weak IAM — closer to a breach scenario). Vulnerability reflects guardrails: organization-level public-access blocks, configuration-posture monitoring, least-privilege reviews, and how long an exposure persists before detection, since record count grows with the exposure window. Loss magnitude follows the data involved, and the "researcher found it first" outcome — notification duties without confirmed misuse — is common enough to deserve its own probability in the estimate.',
    ],
    incidents: [
      { name: 'Capital One', year: '2019', summary: 'A former cloud-provider employee exploited a misconfigured WAF role via SSRF to pull ~106 million credit applications from S3; costs included an $80 million regulatory penalty and a $190 million settlement.' },
      { name: 'Microsoft Power Apps portals', year: '2021', summary: 'A default permission setting left OData APIs public across thousands of portals, exposing 38 million records including COVID-contact-tracing and job-applicant data before coordinated disclosure.' },
      { name: 'Toyota connected-car data exposure', year: '2023', summary: 'Toyota disclosed that a cloud misconfiguration had left vehicle-location data of about 2.15 million customers publicly accessible for roughly a decade without detected misuse.' },
    ],
  },
  {
    typeId: 'ot-cyber-physical',
    inDepth: [
      'Operational technology inverts IT\'s priorities: availability and safety come first, confidentiality last. The equipment — PLCs, SCADA servers, building controllers, networked medical devices, radio systems — runs for decades, often cannot be patched without a maintenance outage, and speaks protocols designed with no authentication at all. Attackers rarely start in OT: they arrive through the IT network, a remote-access path built for convenience, or a vendor\'s standing connection, then cross a boundary that segmentation was supposed to protect. Once there, doing damage requires little sophistication because the systems trust whatever reaches them.',
      'For FAIR estimates, frequency is low but rising, driven by sector (utilities, manufacturing, healthcare), geopolitical exposure, and how much of the control surface is remotely reachable — internet-exposed HMIs move a scenario into a different frequency class entirely. Vulnerability turns on IT/OT segmentation quality, remote-access hygiene, and whether anyone monitors the OT network at all. Primary loss is dominated by production or service downtime and manual-operations cost, with equipment damage in the tail; secondary loss covers safety and environmental consequences, sector regulators (NERC CIP, FDA, state utility commissions), and insurance repricing. Scoping assumptions should state whether safety-instrumented systems and physical damage are in or out of the modeled scenario.',
    ],
    incidents: [
      { name: 'Maroochy Shire sewage spill', year: '2000', summary: 'A rejected contractor used stolen radio equipment to issue commands to sewage pumping stations in Queensland, releasing roughly a million liters of raw sewage — the canonical early cyber-physical attack, and an insider one.' },
      { name: 'Ukraine power grid attacks', year: '2015–2016', summary: 'Russian military hackers switched off substations serving ~230,000 Ukrainians in 2015 (BlackEnergy) and repeated it in 2016 with Industroyer, the first malware built to speak grid control protocols directly.' },
      { name: 'Triton / Trisis', year: '2017', summary: 'Malware at a Saudi petrochemical plant targeted the safety instrumented systems — the last line of defense against explosions — and triggered emergency shutdowns when a flaw in the attack code tripped the controllers.' },
    ],
  },
  {
    typeId: 'apt-nation-state',
    inDepth: [
      'Advanced persistent threats differ from criminal intrusions in patience and purpose: entry is bespoke (zero-days, supply-chain implants, carefully researched spear phishing), persistence is layered across multiple redundant footholds, and activity is disciplined — living off legitimate admin tools, moving slowly, taking only what the mission needs. Espionage campaigns can run for years; pre-positioning campaigns may do nothing at all until a geopolitical trigger. Eviction is a project in itself, because partial cleanup just teaches the adversary what you can see.',
      'For most organizations the honest FAIR framing is low frequency, high magnitude, with frequency driven by what the organization holds (defense work, critical infrastructure, research, dissident data, or access to a more interesting downstream target). Vulnerability against this adversary class is never zero — the estimate really measures time-to-detection, shaped by logging depth, network segmentation, and hunt capability. Primary loss centers on the eviction and rebuild effort; secondary loss — lost IP value, national-security exposure, customer and regulator fallout — is hard to bound and argues for wide, explicitly uncertain ranges rather than false precision.',
    ],
    incidents: [
      { name: 'US Office of Personnel Management', year: '2015', summary: 'Chinese state actors exfiltrated background-investigation files on 21.5 million people, including security-clearance details and fingerprints — espionage with decades-long consequences.' },
      { name: 'Microsoft Exchange / HAFNIUM', year: '2021', summary: 'Zero-day ProxyLogon exploits gave a Chinese state group mailbox access at tens of thousands of organizations; webshells left behind were then mass-exploited by criminal groups.' },
      { name: 'Salt Typhoon telecom intrusions', year: '2024–2025', summary: 'A Chinese state campaign penetrated major US telecommunications carriers, reaching lawful-intercept systems and call metadata of political figures, and persisted through initial eviction attempts.' },
    ],
  },
  {
    typeId: 'physical-theft',
    inDepth: [
      'Device loss is mundane and constant — laptops left in cars and cafes, phones in taxis, drives in checked luggage — and opportunistic thieves usually want the hardware, not the data. The risk calculus therefore turns almost entirely on encryption state: a lost device with full-disk encryption and a decent unlock policy is an inventory event, while the same device unencrypted is a reportable breach of everything it held or could reach. Cached credentials and long-lived sessions extend exposure beyond the disk to cloud accounts and VPNs.',
      'Threat event frequency is one of the easier FAIR estimates: fleet size times a per-device annual loss rate, adjusted for travel patterns and where devices go. Vulnerability is the fraction of the fleet without verified encryption and remote-wipe — measurable directly from device-management data rather than guessed. Primary loss per event is small (replacement, wipe, short productivity hit); the tail risk lives in secondary loss when an unencrypted device with regulated data triggers notification, and regulators have repeatedly treated missing encryption as the aggravating factor in penalties.',
    ],
    incidents: [
      { name: 'US Department of Veterans Affairs laptop', year: '2006', summary: 'A laptop and external drive holding records on 26.5 million veterans were stolen in a home burglary; the formative US device-breach case, later settled for $20 million, though the hardware was recovered.' },
      { name: 'Heathrow Airport USB drive', year: '2017', summary: 'A member of the public found an unencrypted USB stick containing airport security plans, patrol schedules, and royal travel routes; the ICO fined the airport £120,000.' },
      { name: 'Lifespan laptop theft', year: '2017', summary: 'An unencrypted laptop with patient data was stolen from an employee vehicle; the Rhode Island health system paid a $1.04 million HIPAA settlement centered on the missing encryption.' },
    ],
  },
  {
    typeId: 'social-engineering',
    inDepth: [
      'Social engineering succeeds by manufacturing a context in which the victim\'s compliance feels correct: an IT technician who needs your MFA code to fix an outage, a new-starter locked out before a deadline, a delivery driver who just needs the door held. Help desks have become a favorite target — attackers with a little scraped personal data talk agents into resetting passwords and re-enrolling MFA on accounts they don\'t own. Voice cloning and other AI aids are lowering the skill needed to run these plays convincingly at scale.',
      'FAIR scenarios should name the channel and objective (help-desk reset, phone pretext against finance, physical tailgating) because each has different controls and loss paths. Frequency tracks organizational visibility and how much employee information is publicly scrapeable; vulnerability is procedural — identity-verification steps that hold up under a fluent, pressuring caller, and a culture where refusing an "executive" is safe. Losses follow what the attacker does with the access, so this type frequently chains into BEC, ransomware, or data-breach scenarios, and the scoping assumption should say where the hand-off happens.',
    ],
    incidents: [
      { name: 'Twitter account-takeover', year: '2020', summary: 'Teenagers phone-phished Twitter employees to reach internal admin tools, hijacking verified accounts of Obama, Musk, Biden and others for a bitcoin scam — and demonstrating insider-tool exposure.' },
      { name: 'MGM Resorts', year: '2023', summary: 'Scattered Spider impersonated an employee found on LinkedIn in a ten-minute help-desk call, gaining access that led to ransomware, days of casino and hotel outages, and ~$100 million in losses.' },
      { name: 'Retool', year: '2023', summary: 'SMS phishing plus an AI-cloned voice of an IT staffer convinced an employee to share an MFA code; attackers pivoted through Okta and a cloud-synced authenticator to reach customer crypto accounts.' },
    ],
  },
  {
    typeId: 'zero-day',
    inDepth: [
      'A zero-day is a vulnerability being exploited before a fix exists, which nullifies patching — the defender\'s primary control — for its duration. True zero-day use concentrates in state actors and top-tier criminal groups because the exploits are expensive and burn on discovery; most organizations experience them indirectly, through mass exploitation of edge devices (VPNs, file-transfer appliances, mail gateways) in the window between disclosure and their own patch. That n-day window, measured in days for defenders but hours for attackers, is where the bulk of real-world losses occur.',
      'For FAIR, frequency should distinguish "targeted with a true zero-day" (low, driven by adversary interest) from "caught in mass exploitation of a new flaw in something we run" (a function of how many internet-facing products the organization operates and their track records). Vulnerability reflects compensating controls when patching can\'t help yet: segmentation limiting blast radius, EDR catching post-exploit behavior, and speed of emergency response once advisories land. Loss magnitude mirrors whatever the exposed system protects; treatment analysis often favors reducing exposed surface and improving response time over any control that promises prevention.',
    ],
    incidents: [
      { name: 'Stuxnet', year: '2010', summary: 'A US-Israeli operation chained four Windows zero-days to cross air gaps and sabotage Iranian uranium-enrichment centrifuges — the canonical demonstration of zero-day capability.' },
      { name: 'Log4Shell', year: '2021', summary: 'A trivially exploitable flaw in the ubiquitous Log4j library was exploited in the wild before public disclosure, then triggered a global emergency-patching effort as scanning began within hours.' },
      { name: 'Ivanti Connect Secure zero-days', year: '2024', summary: 'State-linked actors chained zero-days in the widely deployed VPN appliance; exploitation before patches existed forced emergency federal directives to disconnect devices.' },
    ],
  },
  {
    typeId: 'mitm',
    inDepth: [
      'Interception attacks insert the adversary into a trusted path: a rogue Wi-Fi access point or ARP spoofing on a local network, a hijacked BGP route or poisoned DNS answer redirecting traffic at internet scale, or a fraudulent TLS certificate that lets the attacker impersonate the destination itself. Ubiquitous HTTPS has pushed the practical attacks toward the trust infrastructure — certificate authorities, DNS, routing — and toward downgrade tricks that strip or bypass encryption where clients allow it.',
      'In FAIR terms this is usually a low-frequency, targeted technique: the estimate should name who would intercept (local attacker, criminal redirecting sessions, state actor with routing access) because their capabilities differ by orders of magnitude. Vulnerability reflects transport-security hygiene — strict TLS validation, HSTS, certificate monitoring, DNSSEC/RPKI where applicable, and VPN posture for mobile workers on untrusted networks. Primary loss follows what transited the intercepted path (credentials, payment redirection, session takeover); secondary loss rises when interception silently persists, because everything in the window becomes suspect.',
    ],
    incidents: [
      { name: 'DigiNotar', year: '2011', summary: 'Attackers who breached the Dutch certificate authority issued rogue certificates used to intercept Gmail sessions of ~300,000 Iranian users; browser vendors distrusted the CA and the company folded within weeks.' },
      { name: 'Lenovo Superfish', year: '2015', summary: 'Preinstalled adware shipped with a shared root certificate that broke TLS on consumer laptops, letting anyone on the same network impersonate any HTTPS site to affected machines; the FTC settlement followed.' },
      { name: 'Amazon Route 53 BGP hijack', year: '2018', summary: 'Attackers hijacked routes to Amazon\'s DNS service to hand out forged answers for MyEtherWallet, redirecting users to a phishing clone and stealing about $150,000 in cryptocurrency.' },
    ],
  },
  {
    typeId: 'cryptojacking',
    inDepth: [
      'Cryptojacking monetizes stolen compute directly: malware or malicious container images mine cryptocurrency on compromised servers, or attackers spin up mining fleets inside a victim\'s cloud account on hijacked credentials. It thrives where oversight is thin — orphaned VMs, exposed Kubernetes dashboards and Docker APIs, CI pipelines with free compute minutes. Operators tune miners to stay quiet, throttling CPU when users are active, so infections can persist for months as an unexplained line item.',
      'FAIR-wise, frequency tracks the exposed automation surface (cloud APIs, container orchestration, leaked keys in repositories) and is rising wherever cloud spend is loosely monitored. Vulnerability reflects credential hygiene, workload-identity scoping, and — the practical detector — billing and utilization anomaly alerts, since the cloud bill usually notices before security tooling does. Primary loss is quantifiable in the pleasantest way in this catalog: compute charges, energy, and cleanup. The secondary consideration is what the infection proves — an access path that could have delivered ransomware instead — which some analysts model as a separate chained scenario.',
    ],
    incidents: [
      { name: 'Tesla Kubernetes cryptojacking', year: '2018', summary: 'Researchers found miners running in Tesla\'s AWS environment after an unprotected Kubernetes console exposed credentials; the operators had throttled CPU and hidden the pool behind Cloudflare to evade detection.' },
      { name: 'Coinhive browser-mining era', year: '2017–2019', summary: 'An embeddable JavaScript miner was injected into thousands of compromised sites — including UK and US government pages via a poisoned accessibility plugin — before the service shut down.' },
      { name: 'TeamTNT cloud campaigns', year: '2020–2021', summary: 'A prolific group mass-scanned for exposed Docker and Kubernetes APIs, deploying miners and credential-stealing worms that harvested AWS keys to propagate across victims\' cloud accounts.' },
    ],
  },
  {
    typeId: 'payment-fraud',
    inDepth: [
      'Beyond email-borne invoice fraud, payment fraud targets the payment systems themselves: compromised online-banking sessions initiating transfers, manipulated batch files between ERP and bank, fraudulent changes to payroll or supplier master data, and — at the high end — intrusions into interbank messaging where a single forged instruction moves eight figures. The common thread is that the fraudulent movement looks procedurally legitimate; it is initiated or approved through real channels with real credentials.',
      'FAIR frequency estimates anchor well on transaction volume and the number of people and systems able to create or approve payments; organizations with predictable large disbursements (auctions, closings, payroll runs) face concentrated windows. Vulnerability turns on payment-control architecture: dual authorization thresholds, out-of-band callbacks on detail changes, bank-side positive pay, and reconciliation speed — which caps how many fraudulent cycles fit inside the detection window. Primary loss is the unrecovered funds; recovery probability decays within days and should be an explicit assumption. Secondary loss includes bank-relationship damage, insurance disputes, and audit-remediation costs.',
    ],
    incidents: [
      { name: 'The Scoular Company', year: '2015', summary: 'A controller wired $17.2 million to a Chinese bank in three transfers on emailed instructions impersonating the CEO and the company\'s auditor around a fictitious acquisition.' },
      { name: 'Bangladesh Bank SWIFT heist', year: '2016', summary: 'North Korean-linked attackers compromised the central bank\'s SWIFT environment and issued transfer orders for $951 million; $81 million left through Philippine casinos, most never recovered — a typo halted the rest.' },
      { name: 'Leoni AG', year: '2016', summary: 'The German cable manufacturer lost about €40 million when a finance employee at a Romanian subsidiary executed transfers on spoofed instructions crafted to match internal approval procedures.' },
    ],
  },
  {
    typeId: 'third-party-breach',
    inDepth: [
      'Third-party risk arrives on two distinct paths: a vendor holding your data is breached (custodial exposure — you inherit the notification duties and reputational fallout without having been touched), or a vendor\'s access into your environment becomes the attacker\'s road in (connectivity exposure — their VPN account, support tunnel, or integration token is the foothold). Concentration risk compounds both: when many organizations share one processor or platform, a single incident cascades across an entire sector, as file-transfer and identity-provider compromises keep demonstrating.',
      'Model the two paths as separate FAIR scenarios: custodial frequency scales with how many vendors hold sensitive data (the vendor inventory is the estimate\'s backbone), while connectivity frequency scales with how many parties hold standing access. Vulnerability for custodial exposure is mostly the vendor\'s posture — informed by due diligence but not controlled — whereas connectivity vulnerability is yours: least-privilege vendor accounts, segmentation, and monitoring of third-party sessions. Contracts move money around inside the loss estimate (indemnities, breach-cost clauses, required insurance) and deserve explicit assumptions, since recovery under them is neither immediate nor certain.',
    ],
    incidents: [
      { name: 'Target', year: '2013', summary: 'Attackers phished an HVAC contractor and rode its vendor-portal access into Target\'s network, ultimately stealing 40 million card numbers from point-of-sale systems during the holiday season.' },
      { name: 'American Medical Collection Agency', year: '2019', summary: 'A breach at the medical-debt collector exposed data of over 20 million patients of Quest, LabCorp, and other labs; the clients absorbed the notification duties and AMCA filed for bankruptcy.' },
      { name: 'Okta support-system breach', year: '2023', summary: 'Stolen credentials exposed support case files, including session tokens customers had uploaded; downstream targets such as Cloudflare and 1Password detected and contained the attempted follow-on intrusions.' },
    ],
  },
  {
    typeId: 'destructive-attack',
    inDepth: [
      'Destructive attacks aim to deny, not monetize: wipers that overwrite data and boot records (sometimes masquerading as ransomware with no real decryption path), firmware attacks that brick hardware, and operational-technology intrusions that halt physical processes. They cluster around geopolitical conflict and hacktivism, and the worst damage is often collateral — self-propagating destructive code does not respect the attacker\'s intended target list. Recovery differs fundamentally from ransomware: there is no key to buy, so restoration capacity is the whole game.',
      'For most organizations the FAIR frequency estimate keys on proximity to conflict — operations, suppliers, or infrastructure in contested regions, or membership in a targeted sector — plus the collateral-damage channel through shared software and networks. Vulnerability is dominated by recoverability: offline immutable backups, tested bare-metal restore times, and segmentation between IT and OT. Primary loss is rebuild effort and outage duration across everything hit simultaneously — capacity constraints (people, hardware lead times) stretch timelines in ways per-system estimates miss. Secondary loss covers contractual failures and safety or environmental consequences where physical processes are involved.',
    ],
    incidents: [
      { name: 'Shamoon / Saudi Aramco', year: '2012', summary: 'A wiper destroyed data on roughly 30,000 workstations at the oil giant, forcing weeks of paper-based operations and an emergency global purchase of hard drives.' },
      { name: 'NotPetya', year: '2017', summary: 'A Russian wiper disguised as ransomware, seeded through Ukrainian accounting software, spread worldwide within hours — Maersk, Merck, and FedEx each reported losses in the hundreds of millions, ~$10 billion overall.' },
      { name: 'Viasat KA-SAT / AcidRain', year: '2022', summary: 'Hours before the invasion of Ukraine, a wiper bricked tens of thousands of satellite modems across Europe, with collateral effects including remote monitoring of 5,800 German wind turbines.' },
    ],
  },
];

// Lookup by compromise-type id; returns null for types without an entry
// (including 'other'), which the Learn-more screen renders as the original
// "coming soon" placeholders.
export function kbForType(typeId) {
  return KNOWLEDGE_BASE.find((entry) => entry.typeId === typeId) || null;
}
