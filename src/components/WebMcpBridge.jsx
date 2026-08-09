import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/lib/ProjectContext';
import useScenarios from '@/hooks/useScenarios';
import { expectedLoss } from '@/lib/qcr/fair';
import { installWebMcp, isWebMcpEnabled } from '@/lib/mcp/webmcp';

// Registers the QCR WebMCP tools while mounted — the shared compute tools plus
// two app-action tools that read/drive the live app. Runs only when the browser
// supports WebMCP and the user opted in (localStorage qcr.webmcp='1'). App tools
// read current state through a ref so a single registration stays current as the
// open project/scenarios change. Renders nothing.
export default function WebMcpBridge() {
  const { currentProject } = useProject();
  const { scenarios } = useScenarios(currentProject?.id);
  const navigate = useNavigate();

  const ref = useRef({});
  ref.current = { project: currentProject, scenarios, navigate };

  useEffect(() => {
    if (!isWebMcpEnabled()) return undefined;
    const appTools = [
      {
        name: 'list_scenarios',
        description: 'List the scenarios in the currently open QCR project, each with its deterministic ALE.',
        inputSchema: { type: 'object', properties: {} },
        annotations: { readOnlyHint: true },
        execute: async () => {
          const { project, scenarios: rows } = ref.current;
          return {
            project: project ? { id: project.id, name: project.name } : null,
            scenarios: (rows || []).map((s) => ({
              id: s.id, name: s.name, owner: s.owner || null, ale: expectedLoss(s.fair).ale,
            })),
          };
        },
      },
      {
        name: 'open_workbench_step',
        description: 'Navigate the open app to a scenario workbench step (scoping, fair, assumptions, expected-loss, simulation, treatments, report).',
        inputSchema: {
          type: 'object',
          properties: {
            scenario_id: { type: 'string', description: 'Scenario id (from list_scenarios)' },
            step: {
              type: 'string',
              enum: ['scoping', 'fair', 'assumptions', 'expected-loss', 'simulation', 'treatments', 'report'],
            },
          },
          required: ['scenario_id', 'step'],
        },
        annotations: { readOnlyHint: false },
        execute: async ({ scenario_id, step }) => {
          const path = `/scenarios/${scenario_id}/${step}`;
          ref.current.navigate(path);
          return { navigated: path };
        },
      },
    ];
    return installWebMcp({ appTools });
  }, []);

  return null;
}
