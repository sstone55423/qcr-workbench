// Executive-facing report — line-for-line port of v0 reporting.py, with an
// optional AI-narrative appendix (disclosed and provenance-stamped). All prose
// lives in the xr.* dictionary keys; markdown structure (headings, table pipes,
// blockquote, emphasis) stays here so translators only ever see text.
import { translate } from '@/lib/i18n';

export function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-US');
}

const pct1 = (value) => (value * 100).toFixed(1) + '%';

// Callers pass the UI's t so the report renders (and downloads) in the active
// language; the default keeps pure-function callers and tests in English.
const enT = (key, vars) => translate('en', key, vars);

export function executiveSummary(scenario, expected, simulation = null, treatment = null, aiNarrative = null, t = enT) {
  const c = formatCurrency;
  const lines = [
    `# ${t('xr.title', { name: scenario.name })}`,
    '',
    t('xr.riskStatement', { description: scenario.description }),
    t('xr.owner', { owner: scenario.owner }),
    '',
    `## ${t('xr.exposureTitle')}`,
    '',
    t('xr.exposureBody', { ale: c(expected.ale), lef: expected.lef.toFixed(2), lm: c(expected.lossMagnitude) }),
  ];
  if (simulation) {
    const tailMultiple = expected.ale ? simulation.percentile_95 / expected.ale : 0;
    lines.push(
      '',
      t('xr.mcP95', { p95: c(simulation.percentile_95) }),
      '',
      `### ${t('xr.interpretTitle')}`,
      '',
      t('xr.interpretBody'),
      '',
      `| ${t('xr.colMeasure')} | ${t('xr.colAnnualLoss')} | ${t('xr.colInterpretation')} |`,
      '|---|---:|---|',
      `| ${t('xr.rowAle')} | ${c(expected.ale)} | ${t('xr.rowAleNote')} |`,
      `| ${t('xr.rowMean')} | ${c(simulation.mean)} | ${t('xr.rowMeanNote')} |`,
      `| ${t('xr.rowMedian')} | ${c(simulation.median)} | ${t('xr.rowMedianNote')} |`,
      `| ${t('xr.rowP90')} | ${c(simulation.percentile_90)} | ${t('xr.rowP90Note')} |`,
      `| ${t('xr.rowP95')} | ${c(simulation.percentile_95)} | ${t('xr.rowP95Note')} |`,
      `| ${t('xr.rowP99')} | ${c(simulation.percentile_99)} | ${t('xr.rowP99Note')} |`,
      '',
      t('xr.tailBody', { multiple: tailMultiple.toFixed(1), zero: pct1(simulation.probability_of_zero_loss) }),
    );
  }
  if (treatment) {
    lines.push(
      '',
      `## ${t('xr.treatmentTitle')}`,
      '',
      t('xr.treatmentBody', { reduction: c(treatment.riskReduction), net: c(treatment.netBenefit) }),
    );
  }
  lines.push('', `## ${t('xr.assumptionsTitle')}`, '', ...(scenario.assumptions || []).map((item) => `- ${item}`));
  if (aiNarrative?.text) {
    const p = aiNarrative.provenance || {};
    lines.push(
      '',
      `## ${t('xr.aiTitle')}`,
      '',
      `> ${t('xr.aiDisclosure')}`,
      '',
      aiNarrative.text,
      '',
      `*${t('xr.aiProvenance', { label: p.label || p.provider || 'AI', model: p.model || '—', date: p.at || '—' })}*`,
    );
  }
  lines.push('', '---', '', `*${t('xr.methodology')}*`);
  return lines.join('\n');
}
