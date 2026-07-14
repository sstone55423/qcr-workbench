// Executive-facing report — line-for-line port of v0 reporting.py, with an
// optional AI-narrative appendix (disclosed and provenance-stamped).

export function formatCurrency(value) {
  return '$' + Math.round(value).toLocaleString('en-US');
}

const pct1 = (value) => (value * 100).toFixed(1) + '%';

export function executiveSummary(scenario, expected, simulation = null, treatment = null, aiNarrative = null) {
  const c = formatCurrency;
  const lines = [
    `# Quantitative Cyber Risk Report: ${scenario.name}`,
    '',
    `**Risk statement:** ${scenario.description}`,
    `**Accountable owner:** ${scenario.owner}`,
    '',
    '## Financial exposure',
    '',
    `The modeled annualized loss expectancy is **${c(expected.ale)}**, ` +
      `based on ${expected.lef.toFixed(2)} expected loss events per year and ` +
      `${c(expected.lossMagnitude)} expected loss per event.`,
  ];
  if (simulation) {
    const tailMultiple = expected.ale ? simulation.percentile_95 / expected.ale : 0;
    lines.push(
      '',
      `Monte Carlo analysis estimates a 95th-percentile annual loss of **${c(simulation.percentile_95)}**.`,
      '',
      '### How to interpret the difference',
      '',
      'The annualized loss expectancy and the 95th percentile answer different questions. ' +
        'ALE is the long-run average loss across many years; it is the appropriate comparison to the simulated mean. ' +
        'The 95th percentile is a tail-risk threshold: only 5% of simulated years produce a larger loss.',
      '',
      '| Measure | Annual loss | Interpretation |',
      '|---|---:|---|',
      `| Deterministic ALE | ${c(expected.ale)} | Long-run expected loss |`,
      `| Simulated mean | ${c(simulation.mean)} | Monte Carlo estimate of average loss |`,
      `| Simulated median | ${c(simulation.median)} | Half of simulated years are below this value |`,
      `| 90th percentile | ${c(simulation.percentile_90)} | 10% of simulated years are higher |`,
      `| 95th percentile | ${c(simulation.percentile_95)} | 5% of simulated years are higher |`,
      `| 99th percentile | ${c(simulation.percentile_99)} | 1% of simulated years are higher |`,
      '',
      `The 95th-percentile loss is **${tailMultiple.toFixed(1)}× the ALE**, reflecting uncertainty in event frequency and loss magnitude, ` +
        'the possibility of multiple events in one year, and infrequent high-cost outcomes. ' +
        `The model also estimates a **${pct1(simulation.probability_of_zero_loss)} probability of no loss event** in a given year. ` +
        'This combination of many low- or no-loss years and a small number of severe years creates a right-skewed distribution.',
    );
  }
  if (treatment) {
    lines.push(
      '',
      '## Proposed treatment',
      '',
      `Treatment reduces expected annual loss by **${c(treatment.riskReduction)}**; net annual benefit is **${c(treatment.netBenefit)}**.`,
    );
  }
  lines.push('', '## Key assumptions', '', ...(scenario.assumptions || []).map((item) => `- ${item}`));
  if (aiNarrative?.text) {
    const p = aiNarrative.provenance || {};
    lines.push(
      '',
      '## AI-assisted narrative',
      '',
      '> **Disclosure:** The narrative below was drafted by an AI model from the computed results above and reviewed by the report owner. ' +
        'All quantitative figures in this report are deterministic calculations, not AI output.',
      '',
      aiNarrative.text,
      '',
      `*Drafted by ${p.label || p.provider || 'AI'}${p.model ? ` (${p.model})` : ''}${p.at ? ` on ${p.at}` : ''}.*`,
    );
  }
  lines.push(
    '',
    '---',
    '',
    '*Methodology: Factor Analysis of Information Risk (FAIR™), the open international ' +
      'standard for quantifying information risk. FAIR™ is stewarded by the ' +
      '[FAIR Institute](https://www.fairinstitute.org/). This report was produced with ' +
      'independent software not affiliated with or endorsed by the FAIR Institute.*',
  );
  return lines.join('\n');
}
