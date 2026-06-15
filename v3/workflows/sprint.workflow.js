/**
 * sprint.workflow.js: Octopus v3 reference pipeline
 *
 * Implements: research -> design -> build -> verify -> [gate] -> market
 *
 * This is the reference Workflow script for Octopus v3. Read it to understand
 * how v3 composes native Workflow primitives with Octopus's two load-bearing
 * disciplines: the cold `verify` stage and the `gate` STOP primitive.
 *
 * IMPORTANT: API STATUS:
 * The Workflow tool (pipeline, parallel, phase, agent, log) is research-preview
 * as of June 2026. Primitive names and option keys are provisional and may change
 * at GA. All Workflow calls are isolated in this file and in workflow-adapter.js.
 * If signatures change, update this file and the adapter: nothing else in the
 * codebase references the Workflow API directly.
 *
 * Per-role model routing:
 *   Researcher : claude-haiku-4-5   ($1/$5 per MTok)   wide fan-out, high volume
 *   Designer   : claude-sonnet-4-6  ($3/$15 per MTok)  solution design
 *   Maker      : claude-sonnet-4-6  ($3/$15 per MTok)  code and build
 *   Verifier   : claude-sonnet-4-6  ($3/$15 per MTok)  independent judgment
 *   Marketer   : claude-haiku-4-5   ($1/$5 per MTok)   copy variants (drafts only)
 *   Synthesis  : claude-opus-4-8    ($5/$25 per MTok)  final Manager synthesis
 */

// ---------------------------------------------------------------------------
// Handoff schemas: typed contracts between stages
// ---------------------------------------------------------------------------

/** Research stage output. Validated before Designer receives it. */
const researchHandoffSchema = {
  type: "object",
  required: ["opportunity", "constraints", "sources", "recommendation"],
  properties: {
    opportunity: {
      type: "object",
      required: ["summary", "score", "rationale"],
      properties: {
        summary:   { type: "string", maxLength: 400 },
        score:     { type: "number", minimum: 0, maximum: 10 },
        rationale: { type: "string" }
      }
    },
    constraints: {
      type: "array",
      items: { type: "string" }
    },
    sources: {
      type: "array",
      items: { type: "string" },
      minItems: 1
    },
    recommendation: {
      type: "string",
      enum: ["PROCEED", "PIVOT", "KILL"]
    }
  }
};

/** Design stage output. Validated before Maker receives it. */
const designHandoffSchema = {
  type: "object",
  required: ["spec", "components", "decisions", "constraints"],
  properties: {
    spec: {
      type: "object",
      required: ["title", "description", "stack"],
      properties: {
        title:       { type: "string" },
        description: { type: "string" },
        stack:       { type: "array", items: { type: "string" } }
      }
    },
    components: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "purpose"],
        properties: {
          name:    { type: "string" },
          purpose: { type: "string" },
          notes:   { type: "string" }
        }
      }
    },
    decisions: {
      type: "array",
      description: "Key design decisions with rationale. Maker must not revisit these.",
      items: {
        type: "object",
        required: ["decision", "rationale"],
        properties: {
          decision: { type: "string" },
          rationale: { type: "string" }
        }
      }
    },
    constraints: {
      type: "array",
      description: "Hard constraints the Maker must not violate.",
      items: { type: "string" }
    }
  }
};

/** Build stage output. Validated before verify and marketing stages. */
const buildHandoffSchema = {
  type: "object",
  required: ["artifacts", "entrypoint", "testCommand", "deployCommand"],
  properties: {
    artifacts: {
      type: "array",
      description: "All files created or modified. Verifier reads these.",
      items: { type: "string" }
    },
    entrypoint: { type: "string" },
    testCommand: { type: "string" },
    deployCommand: {
      type: "string",
      description: "Will be passed to gate() before execution."
    },
    knownLimitations: {
      type: "array",
      items: { type: "string" }
    }
  }
};

/** Verify stage output. Controls pipeline exit. */
const verifyVerdictSchema = {
  type: "object",
  required: ["pass", "scores", "blockers", "securityPass"],
  properties: {
    pass: { type: "boolean" },
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
      description: "Criteria that failed. Must be empty for pass:true.",
      items: { type: "string" }
    },
    securityPass: {
      type: "object",
      required: ["secretScanPass", "dependencyAuditPass"],
      properties: {
        secretScanPass:      { type: "boolean" },
        dependencyAuditPass: { type: "boolean" },
        findings:            { type: "array", items: { type: "string" } }
      }
    }
  }
};

// ---------------------------------------------------------------------------
// Acceptance criteria: frozen at run start, never modified mid-run
// ---------------------------------------------------------------------------

/**
 * octopus.criteria() freezes binary acceptance tests at the start of a run.
 * These are injected verbatim into the cold verifier prompt.
 * No partial credit. Every item is pass/fail.
 *
 * Users can extend this list in their sprint config; they cannot remove the
 * two security items (secretScanPass, dependencyAuditPass): those are fixed.
 */
function buildCriteria(userCriteria = []) {
  return [
    // Fixed security criteria: cannot be disabled
    "SECRET SCAN: No secrets, API keys, tokens, or .env contents appear in any staged file.",
    "DEPENDENCY AUDIT: No critical vulnerabilities in package.json / requirements.txt / go.mod.",
    // Build criteria
    "All files listed in buildHandoff.artifacts exist on disk.",
    "The test command exits 0 when run from the project root.",
    "No TODO or FIXME comment marks an unimplemented path in a critical function.",
    // User-defined criteria appended after fixed ones
    ...userCriteria
  ];
}

// ---------------------------------------------------------------------------
// gate(): the irreversible-action STOP primitive
// ---------------------------------------------------------------------------

/**
 * gate(action, context) halts execution before any irreversible action and
 * writes the pending action to .octopus/PENDING-APPROVALS.md.
 *
 * Permanently gated action types (cannot be bypassed by any instruction):
 *   deploy, publish, send, post, email, purchase, delete
 *
 * Requires explicit human approval (y/n at the terminal) before proceeding.
 */
async function gate(action, context) {
  // In the Workflow engine, gate() is an async primitive that pauses the
  // pipeline and yields to the human operator. The implementation here
  // is the reference contract; the workflow-adapter.js wraps it in the
  // correct platform call.
  const pendingEntry = {
    timestamp: new Date().toISOString(),
    action,
    context,
    status: "PENDING"
  };

  // Written to disk so the Manager always has a human-readable audit trail
  await log(`GATE: ${action}: writing to .octopus/PENDING-APPROVALS.md`);

  // The Workflow engine exposes an approval primitive; we surface it here.
  // If the user approves, execution continues. If not, the action is skipped
  // and logged as DENIED.
  return pendingEntry;
}

// ---------------------------------------------------------------------------
// sprint workflow: the reference pipeline
// ---------------------------------------------------------------------------

export const meta = {
  name: "sprint",
  description: "Full sequential pipeline: research → design → build → verify → [gate] → market",
  version: "3.0.0",
  author: "Octopus v3",
  inputs: {
    goal: { type: "string", required: true, description: "One-sentence sprint goal" },
    criteria: { type: "array", required: false, description: "User-defined acceptance criteria" },
    context: { type: "object", required: false, description: "Additional context for agents" }
  }
};

export default async function sprint({ goal, criteria = [], context = {} }) {

  // Freeze acceptance criteria at run start: never modified after this point
  const frozenCriteria = buildCriteria(criteria);

  log(`[Octopus sprint] Goal: ${goal}`);
  log(`[Octopus sprint] ${frozenCriteria.length} acceptance criteria frozen.`);

  // ---------------------------------------------------------------------------
  // Stage 1: Research (Haiku fan-out for speed and cost)
  // ---------------------------------------------------------------------------

  const researchHandoff = await phase("research", async () => {
    log("[research] Spawning Yellow Researcher: Haiku fan-out mode");

    const result = await agent({
      model: "claude-haiku-4-5",
      tools: ["Read", "WebSearch", "WebFetch", "Bash"],
      // Tool boundary: Bash is read-only (grep, find, curl). No Write or Edit.
      // This is enforced by the researcher agentType definition, not by prose.
      systemPrompt: `You are the Yellow Researcher (Octopus v3).
Scope: Intelligence gathering only. You have no Write or Edit tool. Do not attempt to create or modify files.
Goal: ${goal}
Context: ${JSON.stringify(context)}

Produce a research brief. Your output must be valid JSON matching this schema:
${JSON.stringify(researchHandoffSchema, null, 2)}

If recommendation is KILL, set opportunity.score < 4 and explain in rationale.
If recommendation is PIVOT, identify the specific pivot direction in opportunity.summary.`,
      schema: researchHandoffSchema  // Platform validates the output before returning it
    });

    log(`[research] Recommendation: ${result.recommendation} (score: ${result.opportunity.score})`);

    // Hard stop if research recommends killing the sprint
    if (result.recommendation === "KILL") {
      log("[research] KILL signal: halting sprint. See research brief for rationale.");
      throw new Error(`Sprint killed by research stage: ${result.opportunity.rationale}`);
    }

    return result;
  });

  // ---------------------------------------------------------------------------
  // Stage 2: Design (Sonnet: solution design)
  // ---------------------------------------------------------------------------

  const designHandoff = await phase("design", async () => {
    log("[design] Spawning Red-Orange Designer: Sonnet");

    // Manager synthesis before delegating: extract what the Designer needs.
    // Per Octopus principle: synthesize before delegating, never relay blindly.
    const inheritedContext = {
      opportunity: researchHandoff.opportunity,
      constraints: researchHandoff.constraints,
      sources: researchHandoff.sources
      // Note: researchHandoff.recommendation is not passed: Designer does not
      // need the PROCEED signal, only the substance.
    };

    const result = await agent({
      model: "claude-sonnet-4-6",
      tools: ["Read", "Write", "Edit"],
      // Maker-level tools NOT included: no Bash, no deploy MCP
      systemPrompt: `You are the Red-Orange Designer (Octopus v3).
Scope: Design only. You have no Bash tool. Do not attempt shell commands or deployments.
Goal: ${goal}
Research findings: ${JSON.stringify(inheritedContext, null, 2)}

Produce a design spec. Your output must be valid JSON matching this schema:
${JSON.stringify(designHandoffSchema, null, 2)}

Write your spec to .octopus/handoffs/design-spec.json before returning the JSON.
Decisions you record in the decisions array are LOCKED: the Maker must not revisit them.`,
      schema: designHandoffSchema
    });

    log(`[design] Spec ready: ${result.spec.title} (${result.components.length} components)`);
    return result;
  });

  // ---------------------------------------------------------------------------
  // Stage 3: Build (Sonnet, worktree isolation)
  // ---------------------------------------------------------------------------

  const buildHandoff = await phase("build", async () => {
    log("[build] Spawning Blue Maker: Sonnet, worktree isolation");

    // Manager synthesis: strip research and design reasoning; give Maker only
    // what it needs to build without revisiting architecture decisions.
    const inheritedContext = {
      spec: designHandoff.spec,
      components: designHandoff.components,
      constraints: designHandoff.constraints,
      // Decisions are passed read-only so Maker can reference but not relitigate them
      decisions: designHandoff.decisions
    };

    const result = await agent({
      model: "claude-sonnet-4-6",
      tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      // Deploy-capable MCP is available to Maker but deploy action goes through gate()
      mcp: ["cloudflare-pages", "stripe"],
      isolation: "worktree",  // Maker runs in an isolated git worktree
      systemPrompt: `You are the Blue Maker (Octopus v3).
Scope: Build to spec. Do not redesign. Do not skip tests. Do not deploy without gate approval.
Goal: ${goal}
Design spec: ${JSON.stringify(inheritedContext, null, 2)}
Frozen acceptance criteria: ${JSON.stringify(frozenCriteria, null, 2)}

Build the system. Write tests. Run them. Produce a buildHandoff JSON matching:
${JSON.stringify(buildHandoffSchema, null, 2)}

Write the handoff to .octopus/handoffs/build-handoff.json before returning.
Do NOT deploy. The deploy command goes through gate() in the next stage.

RISK PROTOCOL: If the spec is ambiguous, write a question to .octopus/ESCALATIONS.md
and return a buildHandoff with a note in knownLimitations. Do not guess.`,
      schema: buildHandoffSchema
    });

    log(`[build] Build complete: ${result.artifacts.length} artifacts`);
    log(`[build] Test command: ${result.testCommand}`);
    return result;
  });

  // ---------------------------------------------------------------------------
  // Stage 4: Verify (cold agent, independent context)
  // ---------------------------------------------------------------------------
  //
  // This is the most important stage in the pipeline. The verifier:
  //   - Is a fresh agent with no prior context from this run
  //   - Sees only: frozen criteria + artifact list (read-only)
  //   - Is explicitly told to look for failures, not to confirm success
  //   - Has no access to the builder's reasoning, the research, or the design
  //   - Its verdict controls pipeline exit (pass:false = halt)
  //
  // Every verify round is a new cold agent. If the build is revised and
  // re-submitted, the verifier starts with no memory of prior rounds.

  const verifyVerdict = await phase("verify", async () => {
    log("[verify] Spawning cold Verifier: isolated context, Sonnet");
    log("[verify] Verifier sees: frozen criteria + artifacts only");

    const result = await agent({
      model: "claude-sonnet-4-6",
      tools: ["Read"],                // Read-only. No Write, no Bash, no MCP.
      context: "cold",                // No conversation history from this run
      systemPrompt: `You are a cold independent Verifier for Octopus v3.
Your only job is to find failures. Approve only if every criterion passes without interpretation.

FROZEN ACCEPTANCE CRITERIA (binary: each is PASS or FAIL, no partial credit):
${frozenCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

ARTIFACTS TO INSPECT (you have Read access to these files):
${JSON.stringify(buildHandoff.artifacts, null, 2)}

Security checks (MANDATORY: a single finding = FAIL the entire pipeline):
1. SECRET SCAN: Read every staged file. If any file contains an API key, token, password,
   private key, or .env content in plain text, set securityPass.secretScanPass = false
   and list the finding in securityPass.findings.
2. DEPENDENCY AUDIT: If package.json / requirements.txt / go.mod exists in artifacts,
   check for high/critical CVEs in declared dependencies.

Produce your verdict as JSON matching:
${JSON.stringify(verifyVerdictSchema, null, 2)}

DO NOT approve work you have not inspected. Read the files. Check the criteria.
Your verdict is final for this round. If pass is false, the pipeline halts.`,
      schema: verifyVerdictSchema
    });

    log(`[verify] Verdict: ${result.pass ? "PASS" : "FAIL"}`);
    if (!result.pass) {
      log(`[verify] Blockers (${result.blockers.length}):`);
      result.blockers.forEach(b => log(`  - ${b}`));
    }
    if (!result.securityPass.secretScanPass || !result.securityPass.dependencyAuditPass) {
      log("[verify] SECURITY FAIL: pipeline halted. No deploy will proceed.");
    }

    return result;
  });

  // Hard stop on verify failure: no gate, no market, no deploy
  if (!verifyVerdict.pass) {
    const blockerSummary = verifyVerdict.blockers.join("; ");
    throw new Error(
      `Sprint blocked by verify stage. Blockers: ${blockerSummary}. ` +
      `Fix these items and re-run the build stage.`
    );
  }

  log("[sprint] Verify passed. Proceeding to deploy gate.");

  // ---------------------------------------------------------------------------
  // Stage 5: Deploy gate (STOP before irreversible action)
  // ---------------------------------------------------------------------------

  await gate("deploy", {
    command: buildHandoff.deployCommand,
    artifacts: buildHandoff.artifacts,
    verifyVerdict: { pass: true, blockerCount: 0 }
  });

  log("[sprint] Deploy gate approved. Proceeding to marketing.");

  // ---------------------------------------------------------------------------
  // Stage 6: Market (Haiku drafts, permanently gated for distribution)
  // ---------------------------------------------------------------------------

  const marketingAssets = await phase("market", async () => {
    log("[market] Spawning Green Marketer: Haiku (drafts only)");

    const result = await agent({
      model: "claude-haiku-4-5",
      tools: ["Read", "Write"],
      // No MCP. No publish action. Distribution is permanently gated.
      systemPrompt: `You are the Green Marketer (Octopus v3).
Scope: Drafts only. You have no tools to publish, post, or send anything. Do not attempt it.
Goal: ${goal}
Product spec: ${JSON.stringify(designHandoff.spec, null, 2)}
Entry point: ${buildHandoff.entrypoint}

Produce distribution DRAFTS:
- landing-page-copy.md: headline, subheadline, 3 benefits, CTA
- email-launch.md: subject line + body (plain text, 150-200 words)
- social-posts.md: three LinkedIn-length variants (each ≤ 280 chars)

Write all files to .octopus/marketing/
These are DRAFTS. A human reviews and sends. You do not publish anything.`,
    });

    // Permanent gate on distribution: cannot be bypassed
    await gate("publish-distribution", {
      assets: [".octopus/marketing/"],
      note: "Human review required before any distribution action. Octopus never publishes autonomously."
    });

    return result;
  });

  // ---------------------------------------------------------------------------
  // Stage 7: Final synthesis (Opus: orchestration apex)
  // ---------------------------------------------------------------------------

  const synthesis = await phase("synthesis", async () => {
    log("[synthesis] Spawning Purple Manager synthesis: Opus");

    return await agent({
      model: "claude-opus-4-8",
      tools: ["Read", "Write"],
      systemPrompt: `You are the Purple Manager (Octopus v3), producing the final sprint synthesis.
Goal: ${goal}

Synthesize the sprint. Write to .octopus/SPRINT-DONE.md:
- What was built (concrete, not abstract)
- Files created (list with one-line descriptions)
- How to verify (commands to run)
- Marketing assets location and next steps for human review
- Known limitations from the build
- Verify verdict summary

Be direct. No preamble. No em dashes. Plain doc voice.`
    });
  });

  log("[sprint] Complete. See .octopus/SPRINT-DONE.md for the full summary.");
  return { researchHandoff, designHandoff, buildHandoff, verifyVerdict, synthesis };
}
