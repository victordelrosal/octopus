/**
 * review.workflow.js: Octopus v3 adversarial review loop
 *
 * Implements: builder -> cold verifier -> [pass: exit | fail: revise -> repeat]
 *
 * The review loop runs until the cold verifier passes or the budget is exhausted.
 * Every verify round uses a fresh agent with no memory of prior rounds (see
 * ARCHITECTURE.md §e for the full verify protocol).
 *
 * Use when quality matters more than speed: copy refinement, security audit,
 * architecture review, any work where self-assessment is insufficient.
 *
 * IMPORTANT: API STATUS: Workflow tool is research-preview as of June 2026.
 * All Workflow calls are isolated here and in workflow-adapter.js.
 */

// ---------------------------------------------------------------------------
// Review loop configuration
// ---------------------------------------------------------------------------

const DEFAULTS = {
  maxRounds: 3,          // Hard ceiling. Failing after maxRounds = escalate to human.
  verifierModel: "claude-sonnet-4-6",
  builderModel:  "claude-sonnet-4-6"
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const revisionHandoffSchema = {
  type: "object",
  required: ["artifacts", "changesSinceLastRound", "openQuestions"],
  properties: {
    artifacts: {
      type: "array",
      items: { type: "string" },
      description: "All files the verifier should inspect this round"
    },
    changesSinceLastRound: {
      type: "array",
      items: { type: "string" },
      description: "Bullet list of what was changed to address prior blockers"
    },
    openQuestions: {
      type: "array",
      items: { type: "string" },
      description: "Anything the builder is uncertain about. Surfaced to Manager after loop exits."
    }
  }
};

const verifyVerdictSchema = {
  type: "object",
  required: ["pass", "scores", "blockers"],
  properties: {
    pass:    { type: "boolean" },
    scores: {
      type: "array",
      items: {
        type: "object",
        required: ["criterion", "result", "evidence"],
        properties: {
          criterion: { type: "string" },
          result:    { type: "string", enum: ["PASS", "FAIL"] },
          evidence:  { type: "string" }
        }
      }
    },
    blockers: {
      type: "array",
      description: "Must be empty when pass:true.",
      items: { type: "string" }
    }
  }
};

// ---------------------------------------------------------------------------
// review workflow
// ---------------------------------------------------------------------------

export const meta = {
  name: "review",
  description: "Adversarial review loop: builder revises until a cold verifier passes or budget exhausted.",
  version: "3.0.0",
  inputs: {
    task:       { type: "string", required: true, description: "What to build / refine" },
    criteria:   { type: "array",  required: true, description: "Binary acceptance criteria (frozen at start)" },
    artifacts:  { type: "array",  required: false, description: "Existing files to review (optional; builder may create new ones)" },
    maxRounds:  { type: "number", required: false, description: `Max iterations (default: ${DEFAULTS.maxRounds})` },
    agentType:  { type: "string", required: false, description: "builder agentType: maker | designer | marketer" }
  }
};

export default async function review({
  task,
  criteria,
  artifacts = [],
  maxRounds = DEFAULTS.maxRounds,
  agentType = "maker"
}) {

  if (!criteria || criteria.length === 0) {
    throw new Error("review() requires at least one acceptance criterion. Freeze them before starting.");
  }

  // Freeze criteria at loop start. They do not change between rounds.
  const frozenCriteria = [...criteria];

  log(`[review] Task: ${task}`);
  log(`[review] Frozen criteria: ${frozenCriteria.length}`);
  log(`[review] Max rounds: ${maxRounds}`);

  let currentArtifacts = [...artifacts];
  let priorBlockers    = [];
  let round            = 0;
  let lastVerdict      = null;

  // ---------------------------------------------------------------------------
  // Loop: revise -> cold verify -> check -> repeat
  // ---------------------------------------------------------------------------

  while (round < maxRounds) {
    round++;
    log(`[review] Round ${round}/${maxRounds}`);

    // ---- Builder phase ----
    //
    // The builder receives the frozen criteria and the prior round's blockers.
    // It must address every blocker before the verifier will pass.
    // The builder does NOT receive the verifier's full reasoning: only the
    // blocker list. This prevents the builder from arguing with the verifier.

    const builderContext = {
      frozenCriteria,
      priorBlockers,
      artifacts: currentArtifacts,
      isFirstRound: round === 1
    };

    const revision = await phase(`build-round-${round}`, async () => {
      log(`[build-round-${round}] Spawning builder (${agentType})`);

      return await agent({
        model: DEFAULTS.builderModel,
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        systemPrompt: `You are the ${agentType} agent (Octopus v3), round ${round} of the review loop.
Task: ${task}

Frozen acceptance criteria (these do not change):
${frozenCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${priorBlockers.length > 0
  ? `Blockers from the previous verify round (you must address ALL of these):
${priorBlockers.map(b => `  - ${b}`).join("\n")}`
  : "This is the first round. Build or refine the work to satisfy all criteria."
}

Current artifacts: ${JSON.stringify(currentArtifacts)}

Produce your output. Then return a JSON object matching:
${JSON.stringify(revisionHandoffSchema, null, 2)}

You do not argue with criteria. You address each one. If a criterion is impossible, record
it in openQuestions and do your best: the Manager will see the open questions after the loop.`,
        schema: revisionHandoffSchema
      });
    });

    currentArtifacts = revision.artifacts;
    log(`[build-round-${round}] Revision complete. ${revision.changesSinceLastRound.length} changes.`);

    // ---- Cold verify phase ----
    //
    // Fresh agent each round. No context from prior rounds or from the builder's session.
    // Explicitly told to find failures.

    const verdict = await phase(`verify-round-${round}`, async () => {
      log(`[verify-round-${round}] Spawning COLD verifier (no prior context)`);

      return await agent({
        model: DEFAULTS.verifierModel,
        tools: ["Read"],       // Read-only. No Write. No MCP.
        context: "cold",       // No conversation history
        systemPrompt: `You are a cold independent Verifier (Octopus v3), round ${round}.
Your only job is to find failures. Approve only if every criterion passes without interpretation.

FROZEN CRITERIA (binary):
${frozenCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

ARTIFACTS TO INSPECT (you have Read access):
${JSON.stringify(currentArtifacts, null, 2)}

You have no memory of prior rounds. Inspect the current artifacts from scratch.
Do NOT assume prior blockers were fixed: verify each criterion independently.

Return your verdict as JSON:
${JSON.stringify(verifyVerdictSchema, null, 2)}`,
        schema: verifyVerdictSchema
      });
    });

    lastVerdict = verdict;

    log(`[verify-round-${round}] Verdict: ${verdict.pass ? "PASS" : "FAIL"}`);

    if (verdict.pass) {
      log(`[review] Passed on round ${round}. Exiting loop.`);
      break;
    }

    // Failed: extract blockers for the next builder round
    priorBlockers = verdict.blockers;
    log(`[verify-round-${round}] ${priorBlockers.length} blockers for next round:`);
    priorBlockers.forEach(b => log(`  - ${b}`));

    if (round === maxRounds) {
      log(`[review] Max rounds (${maxRounds}) reached without passing. Escalating to Manager.`);
    }
  }

  // ---------------------------------------------------------------------------
  // Exit: synthesis
  // ---------------------------------------------------------------------------

  const passedClean = lastVerdict && lastVerdict.pass;

  const synthesis = await phase("review-synthesis", async () => {
    log("[review-synthesis] Spawning Manager synthesis: Opus");

    return await agent({
      model: "claude-opus-4-8",
      tools: ["Read", "Write"],
      systemPrompt: `You are the Purple Manager (Octopus v3), synthesizing the review loop.
Task: ${task}
Rounds completed: ${round}
Final verdict: ${passedClean ? "PASS" : "FAIL: max rounds exhausted"}

Final artifacts: ${JSON.stringify(currentArtifacts, null, 2)}
Final blockers: ${JSON.stringify(lastVerdict ? lastVerdict.blockers : [], null, 2)}

Write to .octopus/REVIEW-DONE.md:
- Final status (PASS or FAIL) and round count
- What the work produces
- Remaining blockers if any, with recommended next steps
- Any open questions the builder surfaced

${!passedClean ? `
ESCALATION NOTE: The review loop exhausted its budget (${maxRounds} rounds) without a clean pass.
This requires human judgment. Summarize the remaining gap clearly so the human can decide
whether to extend the budget, accept the partial work, or kill the task.` : ""}

Be direct. Plain doc voice. No em dashes.`
    });
  });

  if (!passedClean) {
    log(`[review] Exiting with FAIL after ${round} rounds. See .octopus/REVIEW-DONE.md.`);
  } else {
    log("[review] Complete. See .octopus/REVIEW-DONE.md for summary.");
  }

  return {
    passed: passedClean,
    rounds: round,
    artifacts: currentArtifacts,
    lastVerdict,
    synthesis
  };
}
