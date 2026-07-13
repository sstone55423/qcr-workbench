// FAIR decomposition and deterministic expected loss — port of v0 fair.py.
import { pertMean } from '@/lib/qcr/estimates';

// Factor means and annualized loss expectancy.
// LEF = TEF × Vulnerability; magnitude = primary + SL·SLP; ALE = LEF × magnitude.
export function expectedLoss(fair) {
  const tef = pertMean(fair.threat_event_frequency);
  const vulnerability = pertMean(fair.vulnerability);
  const lef = tef * vulnerability;
  const primaryLoss = pertMean(fair.primary_loss);
  const expectedSecondaryLoss = pertMean(fair.secondary_loss) * pertMean(fair.secondary_loss_probability);
  const lossMagnitude = primaryLoss + expectedSecondaryLoss;
  return {
    tef,
    vulnerability,
    lef,
    primaryLoss,
    expectedSecondaryLoss,
    lossMagnitude,
    ale: lef * lossMagnitude,
  };
}

// Display-ready FAIR inputs. labelKey resolves through i18n at render time.
export function decompositionRows(fair) {
  return [
    { labelKey: 'fair.factorTef', estimate: fair.threat_event_frequency },
    { labelKey: 'fair.factorVulnerability', estimate: fair.vulnerability },
    { labelKey: 'fair.factorPrimaryLoss', estimate: fair.primary_loss },
    { labelKey: 'fair.factorSecondaryLoss', estimate: fair.secondary_loss },
    { labelKey: 'fair.factorSlp', estimate: fair.secondary_loss_probability },
  ];
}
