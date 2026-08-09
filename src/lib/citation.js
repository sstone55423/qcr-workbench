// App identity used across the UI (welcome notice, issue reporter, help page).
export const APP_NAME = 'QCR Workbench';
export const APP_VERSION = '1.0';
export const APP_AUTHOR = 'Scott Thomas Stone';
export const APP_YEAR = '2026';
export const APP_URL = 'https://github.com/sstone55423/qcr-workbench';
export const APP_ORCID = '0000-0003-2718-6848';

export const APP_FUNDING_URL = 'https://github.com/sponsors/sstone55423';
export const APP_KOFI_URL = 'https://ko-fi.com/qcrworkbench';

export const APP_SUPPORT_EMAIL = 'support@qcr-workbench.org';

// The methodology's home: FAIR™ (Factor Analysis of Information Risk) is
// stewarded by the FAIR Institute. Credited on the FAIR step, the Help page,
// and in every exported report.
export const FAIR_INSTITUTE_URL = 'https://www.fairinstitute.org/';

export const CITATION_APA =
  `Stone, S. T. (${APP_YEAR}). ${APP_NAME}: A local-first quantitative cyber risk workbench (Version ${APP_VERSION}) [Computer software]. ${APP_URL}`;

export const CITATION_BIBTEX = `@software{stone${APP_YEAR}qcr,
  author = {Stone, Scott Thomas},
  title = {${APP_NAME}: A local-first quantitative cyber risk workbench},
  year = {${APP_YEAR}},
  version = {${APP_VERSION}},
  url = {${APP_URL}}
}`;

export const CITATIONS = [
  { label: 'APA', text: CITATION_APA },
  { label: 'BibTeX', text: CITATION_BIBTEX },
];
