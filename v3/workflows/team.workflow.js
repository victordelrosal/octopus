/**
 * team.workflow.js: Octopus v3 parallel fan-out / fan-in
 *
 * Implements: parallel dispatch of independent tasks to multiple agents,
 * followed by Manager synthesis of collected results.
 *
 * Use when tasks are independent and can run simultaneously.
 * Examples: three competitor analyses in parallel; UI design + backend scaffolding at once.
 *
 * IMPORTANT: API STATUS: Workflow tool is research-preview as of June 2026.
 * All Workflow calls are isolated here and in workflow-adapter.js.
 */

// ---------------------------------------------------------------------------
// Task-to-agent routing
// ---------------------------------------------------------------------------

/**
 * Maps a task type to the appropriate agentType and model.
 * The caller specifies agentType explicitly or lets the Manager infer it.
 */
const AGENT_ROUTING = {
  research:  { agentType: "researcher", model: "claude-haiku-4-5",  tools: ["Read", "WebSearch", "WebFetch", "Bash"] },
  design:    { agentType: "designer",   model: "claude-sonnet-4-6", tools: ["Read", "Write", "Edit"] },
  build:     { agentType: "maker",      model: "claude-sonnet-4-6", tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"] },
  market:    { agentType: "marketer",   model: "claude-haiku-4-5",  tools: ["Read", "Write"] },
  // Default for unclassified tasks: Sonnet with broad tools
  default:   { agentType: "maker",      model: "claude-sonnet-4-6", tools: ["Read", "Write", "Edit", "Bash"] }
};

// ---------------------------------------------------------------------------
// Handoff schema for team results
// ---------------------------------------------------------------------------

const teamResultSchema = {
  type: "object",
  required: ["taskId", "agentType", "status", "output", "artifacts"],
  properties: {
    taskId:    { type: "string" },
    agentType: { type: "string" },
    status:    { type: "string", enum: ["DONE", "BLOCKED", "PARTIAL"] },
    output:    { type: "string", description: "Prose summary of what was completed" },
    artifacts: { type: "array", items: { type: "string" } },
    blockers:  { type: "array", items: { type: "string" } }
  }
};

// ---------------------------------------------------------------------------
// team workflow
// ---------------------------------------------------------------------------

export const meta = {
  name: "team",
  description: "Parallel fan-out: dispatch independent tasks to multiple agents simultaneously, then synthesize.",
  version: "3.0.0",
  inputs: {
    tasks: {
      type: "array",
      required: true,
      description: "Array of task objects: { id, type, description, context }",
      items: {
        type: "object",
        required: ["id", "description"],
        properties: {
          id:          { type: "string" },
          type:        { type: "string", enum: ["research", "design", "build", "market", "default"] },
          description: { type: "string" },
          context:     { type: "object" }
        }
      }
    },
    goal: { type: "string", required: false, description: "Overarching team goal for synthesis context" }
  }
};

export default async function team({ tasks, goal = "" }) {

  if (!tasks || tasks.length === 0) {
    throw new Error("team() requires at least one task.");
  }

  log(`[team] Dispatching ${tasks.length} tasks in parallel`);
  tasks.forEach(t => log(`  - [${t.id}] ${t.type || "default"}: ${t.description}`));

  // ---------------------------------------------------------------------------
  // Fan-out: all tasks run in parallel
  // ---------------------------------------------------------------------------
  //
  // parallel() provides real barrier semantics: all tasks must complete
  // before fan-in begins. Failed tasks are collected and reported; they do
  // not silently block the synthesis.

  const results = await parallel(
    tasks.map(task => {
      const routing = AGENT_ROUTING[task.type] || AGENT_ROUTING.default;

      return phase(`task-${task.id}`, async () => {
        log(`[team] Starting task: ${task.id} (${routing.agentType}, ${routing.model})`);

        return await agent({
          model: routing.model,
          tools: routing.tools,
          systemPrompt: `You are the ${routing.agentType} agent (Octopus v3).
Task ID: ${task.id}
Task: ${task.description}
${task.context ? `Context: ${JSON.stringify(task.context, null, 2)}` : ""}

Complete this task. Write artifacts to .octopus/team/${task.id}/.
Return a JSON object matching this schema:
${JSON.stringify(teamResultSchema, null, 2)}

If blocked, set status to BLOCKED and list blockers. Do not guess or improvise past a blocker.`,
          schema: teamResultSchema
        });
      });
    })
  );

  // ---------------------------------------------------------------------------
  // Fan-in: collect results, log status
  // ---------------------------------------------------------------------------

  const done    = results.filter(r => r.status === "DONE");
  const blocked = results.filter(r => r.status === "BLOCKED");
  const partial = results.filter(r => r.status === "PARTIAL");

  log(`[team] Fan-in complete: ${done.length} done, ${partial.length} partial, ${blocked.length} blocked`);

  if (blocked.length > 0) {
    log("[team] Blocked tasks:");
    blocked.forEach(r => {
      log(`  - [${r.taskId}] ${r.blockers.join("; ")}`);
    });
  }

  // ---------------------------------------------------------------------------
  // Synthesis (Opus: Manager reads all results and produces integrated summary)
  // ---------------------------------------------------------------------------

  const synthesis = await phase("team-synthesis", async () => {
    log("[team-synthesis] Spawning Manager synthesis: Opus");

    return await agent({
      model: "claude-opus-4-8",
      tools: ["Read", "Write"],
      systemPrompt: `You are the Purple Manager (Octopus v3), synthesizing parallel team results.
${goal ? `Team goal: ${goal}` : ""}

Results from ${results.length} parallel tasks:
${JSON.stringify(results, null, 2)}

Write a synthesis to .octopus/TEAM-DONE.md covering:
- What each task produced (one sentence per task)
- Integrated picture: how the outputs fit together
- Any blockers or partial items and recommended next steps
- All artifact paths for downstream use

Be direct. Plain doc voice. No em dashes.`
    });
  });

  log("[team] Complete. See .octopus/TEAM-DONE.md for integrated summary.");
  return { results, synthesis };
}
