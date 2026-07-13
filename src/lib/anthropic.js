// Direct browser client for the Anthropic Messages API using the user's own key.
// SECURITY: 'anthropic-dangerous-direct-browser-access' is intentional for this
// local-first, bring-your-own-key app — there is no backend to proxy through, and
// the user's own key is sent to the user's chosen provider over TLS. See SECURITY.md.

export async function invokeClaude({ apiKey, prompt, jsonSchema }) {
  if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings.');

  const fullPrompt = jsonSchema
    ? `${prompt}\n\nRespond ONLY with valid JSON matching this schema (no prose, no code fences):\n${JSON.stringify(jsonSchema)}`
    : prompt;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: fullPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error (${resp.status})`);
  }

  const data = await resp.json();
  const text = data.content?.[0]?.text || '';
  if (jsonSchema) {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  }
  return text;
}