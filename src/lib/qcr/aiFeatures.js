// QCR AI features. Design rules (see AI-GOVERNANCE.md): AI never does math —
// prompts embed the already-computed numbers; nothing AI-written enters the
// model without an explicit user action; every output carries provenance.
import { invokeAI, getLastAIRun } from '@/lib/ai';
import { translate } from '@/lib/i18n';
import { formatCurrency } from '@/lib/qcr/reporting';
import { searchDocs } from '@/lib/qcr/retrieval';
import { SAMPLE_LIBRARIES } from '@/data/sampleLibraries';
import { CONTROL_CATALOG } from '@/data/controlCatalog';

// The AI's prose already follows the UI language (invokeAI appends a language
// directive); this default keeps the section labels English for callers that
// don't pass the UI's t.
const enT = (key, vars) => translate('en', key, vars);

// Small stable hash of the inputs a narrative was drafted from, so the UI can
// tell when it has gone stale relative to the current model.
export function inputsHash(scenario, simulationParams) {
  const text = JSON.stringify({ fair: scenario.fair, assumptions: scenario.assumptions, params: simulationParams || null });
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    narrative: { type: 'string', description: '2-3 executive paragraphs' },
    key_risks: { type: 'array', items: { type: 'string' }, description: '3-5 bullets' },
    recommended_actions: { type: 'array', items: { type: 'string' }, description: '3-5 bullets' },
  },
  required: ['narrative', 'key_risks', 'recommended_actions'],
};

export async function draftExecutiveNarrative({ scenario, expected, simulation, comparison, t = enT }) {
  const facts = [
    `Scenario: ${scenario.name} — ${scenario.description}`,
    `Asset: ${scenario.asset}; Threat: ${scenario.threat}; Effect: ${scenario.effect}; Owner: ${scenario.owner}`,
    `Deterministic results: annualized loss expectancy ${formatCurrency(expected.ale)}, ` +
      `${expected.lef.toFixed(2)} loss events/year expected, ${formatCurrency(expected.lossMagnitude)} per event.`,
    simulation
      ? `Monte Carlo results: mean annual loss ${formatCurrency(simulation.mean)}, median ${formatCurrency(simulation.median)}, ` +
        `95th percentile ${formatCurrency(simulation.percentile_95)}, 99th percentile ${formatCurrency(simulation.percentile_99)}, ` +
        `probability of a zero-loss year ${(simulation.probability_of_zero_loss * 100).toFixed(1)}%.`
      : 'No Monte Carlo simulation has been run.',
    comparison
      ? `Proposed treatment: reduces annual expected loss by ${formatCurrency(comparison.riskReduction)} at ` +
        `${formatCurrency(comparison.annualCost)} annual cost (net benefit ${formatCurrency(comparison.netBenefit)}).`
      : 'No treatment is proposed.',
    scenario.assumptions?.length ? `Key assumptions: ${scenario.assumptions.join(' | ')}` : '',
  ].filter(Boolean).join('\n');

  const prompt =
    'You are helping a CISO draft the narrative section of a quantitative cyber risk report for a business-executive audience. ' +
    'Use ONLY the computed figures below — do not invent, recompute, or extrapolate numbers. ' +
    'Write plainly, avoid jargon, and frame the risk in business terms.\n\n' + facts;

  const result = await invokeAI({ prompt, jsonSchema: NARRATIVE_SCHEMA });
  const run = getLastAIRun();
  const bullets = (items, title) => (items?.length ? `\n\n**${title}:**\n${items.map((x) => `- ${x}`).join('\n')}` : '');
  return {
    text: `${result.narrative}${bullets(result.key_risks, t('ai.keyRisks'))}${bullets(result.recommended_actions, t('ai.recommendedActions'))}`,
    provenance: run,
    inputs_hash: inputsHash(scenario, scenario.simulation?.params),
  };
}

const SUGGESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'One concise, testable scoping assumption' },
          rationale: { type: 'string', description: 'Why this assumption matters for the estimate' },
        },
        required: ['text', 'rationale'],
      },
    },
  },
  required: ['suggestions'],
};

// Retrieval corpus over the bundled sample libraries: one doc per sample
// scenario, so suggestion prompts can be grounded with the most similar
// professionally-written examples (few-shot exemplars, not data to copy).
// Module-level so the retrieval token cache is computed once.
const SAMPLE_DOCS = SAMPLE_LIBRARIES.flatMap((library) =>
  library.scenarios.map((sample) => ({
    id: sample.id,
    title: `${sample.name} — ${sample.threat}`,
    body: `${sample.description} ${sample.asset} ${sample.effect} ${(sample.assumptions || []).join(' ')}`,
    sample,
  })));

// The most similar sample scenarios to this one (excluding the sample the
// scenario itself was loaded from, so it never sees its own answers).
export function similarSampleScenarios(scenario, max = 2) {
  const query = [scenario.name, scenario.description, scenario.asset, scenario.threat, scenario.effect]
    .filter(Boolean).join(' ');
  return searchDocs(SAMPLE_DOCS.filter((doc) => doc.id !== scenario.sample_id), query, max)
    .map((hit) => hit.doc.sample);
}

export async function suggestScenarioAssumptions({ scenario }) {
  const exemplars = similarSampleScenarios(scenario);
  const exemplarBlock = exemplars.length
    ? '\n\nReference examples — well-scoped assumptions from similar scenarios in the bundled sample library. ' +
      'Match their concision and coverage (scope boundaries, primary vs secondary loss, measurement basis); ' +
      'do not copy them verbatim:\n' +
      exemplars.map((sample) =>
        `- ${sample.name} (${sample.threat}): ${sample.assumptions.join(' | ')}`).join('\n')
    : '';

  const prompt =
    'You are helping scope a FAIR quantitative cyber risk scenario. Suggest 3-5 concise scoping assumptions ' +
    'that would make the estimates below defensible and reproducible (what is in/out of scope, which costs count ' +
    'as primary vs secondary loss, measurement boundaries). Do not repeat existing assumptions.\n\n' +
    `Scenario: ${scenario.name} — ${scenario.description}\n` +
    `Asset: ${scenario.asset}; Threat: ${scenario.threat}; Effect: ${scenario.effect}\n` +
    `Existing assumptions: ${scenario.assumptions?.length ? scenario.assumptions.join(' | ') : '(none)'}` +
    exemplarBlock;

  const result = await invokeAI({ prompt, jsonSchema: SUGGESTIONS_SCHEMA });
  return { suggestions: result.suggestions || [], provenance: getLastAIRun() };
}

const reduction = (what) => ({
  type: 'number',
  description: `Fraction between 0 and 1 by which the control reduces ${what}`,
});

const TREATMENT_SUGGESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short name of the control or control package' },
          rationale: { type: 'string', description: 'One or two sentences: why this control fits the scenario and what drives its reductions' },
          annual_cost: { type: 'number', description: 'Rough total annual cost in USD (licenses, staffing, operations)' },
          frequency_reduction: reduction('threat event frequency'),
          vulnerability_reduction: reduction('the probability a threat event becomes a loss event'),
          primary_loss_reduction: reduction('primary loss per event'),
          secondary_loss_reduction: reduction('secondary loss per event'),
        },
        required: [
          'name', 'rationale', 'annual_cost',
          'frequency_reduction', 'vulnerability_reduction', 'primary_loss_reduction', 'secondary_loss_reduction',
        ],
      },
    },
  },
  required: ['suggestions'],
};

// Retrieval corpus over the control catalog, keyed the same way as the sample
// corpus. Keywords and effectiveness notes go in the body so scenario
// vocabulary ("ransomware", "wire", "bucket") finds the right controls.
const CONTROL_DOCS = CONTROL_CATALOG.map((control) => ({
  id: control.id,
  title: control.name,
  body: `${control.keywords.join(' ')} ${control.description} ${control.effectiveness_notes}`,
  control,
}));

// The catalog controls most relevant to this scenario, for prompt grounding.
export function relevantControls(scenario, max = 6) {
  const query = [scenario.name, scenario.description, scenario.asset, scenario.threat, scenario.effect]
    .filter(Boolean).join(' ');
  return searchDocs(CONTROL_DOCS, query, max).map((hit) => hit.doc.control);
}

const FACTOR_LABELS = {
  frequency: 'threat event frequency',
  vulnerability: 'vulnerability',
  primary_loss: 'primary loss',
  secondary_loss: 'secondary loss',
};
const describeReductions = (typical) =>
  Object.entries(typical)
    .map(([factor, [lo, hi]]) => `${FACTOR_LABELS[factor]} −${Math.round(lo * 100)}–${Math.round(hi * 100)}%`)
    .join(', ');
const renderControl = (control) =>
  `- ${control.name} [${control.frameworks.join('; ')}]\n` +
  `  ${control.description}\n` +
  `  Typical reductions (planning heuristics): ${describeReductions(control.typical_reductions)}. ${control.effectiveness_notes}\n` +
  `  Cost drivers: ${control.cost_notes}`;

// Draft candidate treatments for the scenario. The drafts are starting points
// only: they open pre-filled in the treatment form for the analyst to review
// and adjust, and the treatment economics are always recomputed
// deterministically from whatever the analyst actually saves. The prompt is
// grounded with the most relevant control-catalog entries so drafted costs and
// reduction fractions anchor on curated reference ranges instead of free
// invention (and cite a recognized framework in the rationale).
export async function suggestScenarioTreatments({ scenario, expected, treatments }) {
  const catalog = relevantControls(scenario);
  const catalogBlock = catalog.length
    ? '\n\nReference control catalog — curated entries relevant to this scenario. Prefer drawing candidates from ' +
      'it when they fit, cite the control name and one framework reference in the rationale, and keep reduction ' +
      'fractions within the typical ranges unless the rationale explains why this environment differs. You may ' +
      'propose a control that is not in the catalog when it clearly fits better — say so in the rationale.\n' +
      catalog.map(renderControl).join('\n')
    : '';

  const prompt =
    'You are helping a CISO shortlist risk treatments (security controls) for the FAIR quantitative cyber risk ' +
    'scenario below. Suggest 3-4 realistic candidate treatments. For each, draft a rough annual cost in USD and the ' +
    'fraction (0 to 1) by which it plausibly reduces each FAIR factor. These are draft starting points a human ' +
    'analyst will review and adjust — be conservative, and let the rationale say what drives the reductions. ' +
    'Do not repeat existing treatments.\n\n' +
    `Scenario: ${scenario.name} — ${scenario.description}\n` +
    `Asset: ${scenario.asset}; Threat: ${scenario.threat}; Effect: ${scenario.effect}\n` +
    `Computed baseline (do not recompute): annualized loss expectancy ${formatCurrency(expected.ale)}, ` +
    `${expected.lef.toFixed(2)} loss events/year expected, ${formatCurrency(expected.lossMagnitude)} per event.\n` +
    `Key assumptions: ${scenario.assumptions?.length ? scenario.assumptions.join(' | ') : '(none)'}\n` +
    `Existing treatments: ${treatments?.length ? treatments.map((x) => x.name).join(' | ') : '(none)'}` +
    catalogBlock;

  const result = await invokeAI({ prompt, jsonSchema: TREATMENT_SUGGESTIONS_SCHEMA });
  const clamp01 = (x) => Math.min(Math.max(Number(x) || 0, 0), 1);
  const suggestions = (result.suggestions || [])
    .map((s) => ({
      name: String(s.name || '').trim(),
      rationale: String(s.rationale || '').trim(),
      annual_cost: Math.max(0, Math.round(Number(s.annual_cost) || 0)),
      frequency_reduction: clamp01(s.frequency_reduction),
      vulnerability_reduction: clamp01(s.vulnerability_reduction),
      primary_loss_reduction: clamp01(s.primary_loss_reduction),
      secondary_loss_reduction: clamp01(s.secondary_loss_reduction),
    }))
    .filter((s) => s.name);
  return { suggestions, provenance: getLastAIRun() };
}
