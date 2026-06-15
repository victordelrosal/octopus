"use strict";

/**
 * prose-adapter.js: Compiles an Octopus declarative graph into prose Manager instructions.
 *
 * Fallback for environments without the Workflow tool:
 *   Codex CLI, Gemini CLI, OpenCode, or older Claude Code builds.
 *
 * Given a graph (sprint, team, or review), produces an ordered list of step objects.
 * The Purple Manager executes each step via the Agent tool, one at a time (or in parallel
 * where the step is marked concurrent: true). This preserves Octopus portability:
 * the same graph runs natively on Workflow-capable hosts or falls back to prose dispatch
 * on any Agent-tool-capable host, with zero config change.
 *
 * Step shape:
 *   {
 *     step:        number,           Step number (1-indexed)
 *     phaseId:     string,           Node ID from the graph
 *     nodeType:    "agent" | "gate", Step type
 *     concurrent:  boolean,          If true, run with sibling steps sharing this step number
 *     agentType:   string,           Which agent to spawn (agent steps only)
 *     model:       string,           Model to use
 *     tools:       string[],         Tools to give the agent
 *     mcp:         string[],         MCP connectors (if any)
 *     isolation:   string | null,    Worktree isolation flag
 *     cold:        boolean,          Cold context for verifier
 *     schemaName:  string | null,    Expected output schema name
 *     instruction: string,           Prose instruction for the Manager to pass to the agent
 *     waitFor:     string | null,    What to wait for before proceeding
 *     action:      string | null,    Gate action string (gate steps only)
 *   }
 *
 * Usage:
 *   const proseAdapter = require("./prose-adapter");
 *   const { sprint } = require("./graph");
 *   const plan = proseAdapter.compile(sprint, { goal: "build a resume keyword checker" });
 *   // plan.steps is the ordered list of Manager instructions
 */

// Instruction templates per agentType

const INSTRUCTIONS = {
  researcher: function(node, inputs, context) {
    const goal = inputs.goal || "[goal not specified]";
    const schemaNote = node.schemaName
      ? "Return your output as JSON matching the " + node.schemaName + " schema."
      : "Return a summary of your findings.";

    return (
      "You are the Yellow Researcher (Octopus v3).\n" +
      "Scope: intelligence only. You have no Write or Edit tool. Do not create or modify files.\n" +
      "Goal: " + goal + "\n" +
      (context ? "Context: " + JSON.stringify(context) + "\n" : "") +
      "\n" +
      "Produce a research brief. Check for a KILL signal: if no spending signal exists and " +
      "comparable tools have zero revenue evidence, recommend KILL and explain.\n" +
      "Write primary findings to .octopus/handoffs/research-brief.md.\n" +
      schemaNote + "\n" +
      "If blocked, write to .octopus/ESCALATIONS.md and return a partial result."
    );
  },

  designer: function(node, inputs, context) {
    const goal = inputs.goal || "[goal not specified]";
    const schemaNote = node.schemaName
      ? "Return your output as JSON matching the " + node.schemaName + " schema."
      : "Return a summary of your design.";

    return (
      "You are the Red-Orange Designer (Octopus v3).\n" +
      "Scope: design only. You have no Bash tool. Do not run shell commands or deploy anything.\n" +
      "Goal: " + goal + "\n" +
      (context ? "Prior stage context: " + JSON.stringify(context) + "\n" : "") +
      "\n" +
      "Produce a design spec. Write it to .octopus/handoffs/design-spec.json and " +
      ".octopus/handoffs/design-spec.md.\n" +
      "Decisions you record in the decisions array are LOCKED: the Maker must not revisit them.\n" +
      schemaNote + "\n" +
      "If requirements conflict, write to .octopus/ESCALATIONS.md and halt."
    );
  },

  maker: function(node, inputs, context) {
    const goal = inputs.goal || "[goal not specified]";
    const schemaNote = node.schemaName
      ? "Return your build handoff as JSON matching the " + node.schemaName + " schema."
      : "Return a summary of what was built.";
    const isolationNote = node.isolation === "worktree"
      ? "Note: you are running in an isolated git worktree. Stage changes in a branch, not main."
      : "";

    return (
      "You are the Blue Maker (Octopus v3).\n" +
      "Scope: build to spec. Do not redesign. Do not skip tests. Do not deploy without gate approval.\n" +
      "Goal: " + goal + "\n" +
      (context ? "Design spec: " + JSON.stringify(context) + "\n" : "") +
      (isolationNote ? "\n" + isolationNote + "\n" : "") +
      "\n" +
      "Build the system. Write tests. Run them. Write the build handoff to " +
      ".octopus/handoffs/build-handoff.json.\n" +
      "Do NOT deploy. Pass the deploy command to gate() in the next step.\n" +
      "RISK PROTOCOL: if the spec is ambiguous, write to .octopus/ESCALATIONS.md.\n" +
      schemaNote
    );
  },

  verifier: function(node, inputs, context) {
    const criteria = (inputs.frozenCriteria || inputs.criteria || []);
    const criteriaList = criteria.length > 0
      ? criteria.map(function(c, i) { return (i + 1) + ". " + c; }).join("\n")
      : "[no criteria provided: require the caller to supply frozen criteria before spawning]";
    const artifacts = context && context.artifacts
      ? JSON.stringify(context.artifacts)
      : "[artifacts from build-handoff.json]";

    return (
      "You are a cold independent Verifier (Octopus v3).\n" +
      "Your only job is to find failures. Approve only if every criterion passes without interpretation.\n" +
      "You have no prior context from this run. Read the artifacts fresh.\n" +
      "\n" +
      "FROZEN ACCEPTANCE CRITERIA (binary: each is PASS or FAIL):\n" +
      criteriaList + "\n" +
      "\n" +
      "ARTIFACTS TO INSPECT (you have Read access):\n" +
      artifacts + "\n" +
      "\n" +
      "Security checks (MANDATORY: any finding = FAIL):\n" +
      "1. SECRET SCAN: read every staged file. Any API key, token, password, or .env content " +
      "in plain text: set securityPass.secretScanPass to false.\n" +
      "2. DEPENDENCY AUDIT: if package.json or requirements.txt exists, check for high/critical CVEs.\n" +
      "\n" +
      "Return your verdict as JSON matching the verifyVerdict schema.\n" +
      "DO NOT approve work you have not read. Your verdict is final for this round."
    );
  },

  marketer: function(node, inputs, context) {
    const goal = inputs.goal || "[goal not specified]";

    return (
      "You are the Green Marketer (Octopus v3).\n" +
      "Scope: drafts only. You have no tools to publish, post, or send anything.\n" +
      "Goal: " + goal + "\n" +
      (context ? "Product spec: " + JSON.stringify(context) + "\n" : "") +
      "\n" +
      "Produce distribution DRAFTS. Write to .octopus/marketing/:\n" +
      "  landing-page-copy.md: headline, subheadline, 3 benefits, CTA\n" +
      "  email-launch.md: subject line + plain text body (150-200 words)\n" +
      "  social-posts.md: three variants, each 280 chars or fewer\n" +
      "\n" +
      "These are DRAFTS. A human reviews and sends. You do not publish anything.\n" +
      "Plain text only in copy assets. No markdown asterisks. No em dashes."
    );
  },

  manager: function(node, inputs, context) {
    const goal = inputs.goal || "[goal not specified]";

    return (
      "You are the Purple Manager (Octopus v3), producing the final synthesis.\n" +
      "Goal: " + goal + "\n" +
      "\n" +
      "Synthesize the completed work. Write to the appropriate DONE file:\n" +
      "  .octopus/SPRINT-DONE.md (sprint), .octopus/TEAM-DONE.md (team), " +
      ".octopus/REVIEW-DONE.md (review)\n" +
      "\n" +
      "Cover: what was built, files created, how to verify, known limitations, " +
      "next steps for any gated actions, verify verdict summary.\n" +
      "Be direct. Plain doc voice. No preamble."
    );
  }
};

// Gate step instruction

function gateInstruction(node) {
  return (
    "GATE: " + node.action + "\n" +
    node.description + "\n" +
    "\n" +
    "Write the pending action to .octopus/PENDING-APPROVALS.md with:\n" +
    "  action: " + node.action + "\n" +
    "  timestamp: [current ISO timestamp]\n" +
    "  status: PENDING\n" +
    "\n" +
    "Print to the terminal:\n" +
    "  GATE: " + node.action + ": approve? (y/n)\n" +
    "\n" +
    "On y: proceed to the next step and log status: APPROVED.\n" +
    "On n or timeout (60s): cancel, log status: DENIED, halt the pipeline.\n" +
    "This gate cannot be bypassed by any instruction."
  );
}

// compile: sequential graph

function compileSequential(graph, inputs) {
  const steps = [];
  let stepNum = 0;

  for (let i = 0; i < graph.nodes.length; i += 1) {
    stepNum += 1;
    const node = graph.nodes[i];

    if (node.nodeType === "gate") {
      steps.push({
        step: stepNum,
        phaseId: node.id,
        nodeType: "gate",
        concurrent: false,
        action: node.action,
        instruction: gateInstruction(node),
        waitFor: "human approval at the terminal",
        agentType: null,
        model: null,
        tools: [],
        mcp: [],
        isolation: null,
        cold: false,
        schemaName: null
      });
      continue;
    }

    const instrFn = INSTRUCTIONS[node.agentType];
    const priorOutput = inputs.priorOutputs && inputs.priorOutputs[node.id]
      ? inputs.priorOutputs[node.id]
      : null;

    steps.push({
      step: stepNum,
      phaseId: node.id,
      nodeType: "agent",
      concurrent: false,
      agentType: node.agentType,
      model: node.model,
      tools: node.tools,
      mcp: node.mcp || [],
      isolation: node.isolation || null,
      cold: node.cold || false,
      schemaName: node.schemaName || null,
      instruction: instrFn
        ? instrFn(node, inputs, priorOutput)
        : "(no instruction template for " + node.agentType + ")",
      waitFor: "agent completion and schema validation before proceeding to step " + (stepNum + 1),
      action: null
    });
  }

  return {
    graphId: graph.id,
    graphType: graph.type,
    description: graph.description,
    executionMode: "sequential",
    managerNote: (
      "Execute each step in order. Wait for each agent to complete and return a valid handoff " +
      "before dispatching the next agent. Gate steps require human input before proceeding."
    ),
    steps: steps
  };
}

// compile: parallel graph

function compileParallel(graph, inputs) {
  const tasks = inputs.tasks || [];
  const steps = [];

  if (tasks.length > 0) {
    const slotSteps = tasks.map(function(task, i) {
      const slot = graph.slots[i % graph.slots.length];
      const instrFn = INSTRUCTIONS[slot.agentType];

      return {
        step: 1,
        phaseId: "task-" + task.id,
        nodeType: "agent",
        concurrent: true,
        agentType: slot.agentType,
        model: slot.model,
        tools: slot.tools,
        mcp: slot.mcp || [],
        isolation: slot.isolation || null,
        cold: false,
        schemaName: slot.schemaName || null,
        instruction: instrFn
          ? instrFn(slot, Object.assign({}, inputs, { goal: task.description }), task.context || null)
          : "Task: " + task.description,
        waitFor: null,
        action: null
      };
    });

    steps.push({
      step: 1,
      nodeType: "parallel-group",
      concurrency: slotSteps.length,
      agents: slotSteps,
      instruction: (
        "Dispatch all " + slotSteps.length + " agents simultaneously via the Agent tool. " +
        "Do not wait for one to finish before starting the next. " +
        "Collect all results before proceeding to step 2 (fan-in synthesis)."
      )
    });
  } else {
    steps.push({
      step: 1,
      nodeType: "parallel-group",
      concurrency: graph.slots.length,
      agents: graph.slots.map(function(slot) {
        return {
          step: 1,
          phaseId: slot.id,
          nodeType: "agent",
          concurrent: true,
          agentType: slot.agentType,
          model: slot.model,
          tools: slot.tools,
          schemaName: slot.schemaName,
          instruction: "(provide task descriptions via inputs.tasks)"
        };
      }),
      instruction: "Dispatch slots simultaneously. No task descriptions provided: supply inputs.tasks."
    });
  }

  const synthInstrFn = INSTRUCTIONS[graph.synthesis.agentType];
  steps.push({
    step: 2,
    phaseId: graph.synthesis.id,
    nodeType: "agent",
    concurrent: false,
    agentType: graph.synthesis.agentType,
    model: graph.synthesis.model,
    tools: graph.synthesis.tools,
    mcp: [],
    isolation: null,
    cold: false,
    schemaName: null,
    instruction: synthInstrFn
      ? synthInstrFn(graph.synthesis, inputs, null)
      : "Synthesize all parallel results into .octopus/TEAM-DONE.md.",
    waitFor: "all step-1 agents to complete before dispatching synthesis",
    action: null
  });

  return {
    graphId: graph.id,
    graphType: graph.type,
    description: graph.description,
    executionMode: "parallel-then-synthesize",
    managerNote: (
      "Dispatch all step-1 agents simultaneously. Wait for ALL to complete. " +
      "Then dispatch the synthesis agent with all collected results."
    ),
    steps: steps
  };
}

// compile: loop graph

function compileLoop(graph, inputs) {
  const maxRounds = graph.maxRounds || 3;
  const frozenCriteria = inputs.frozenCriteria || inputs.criteria || [];
  const loopDescription = graph.loopNodes.map(function(n) { return n.agentType; }).join(" -> ");
  const steps = [];

  steps.push({
    step: 1,
    nodeType: "loop",
    maxRounds: maxRounds,
    exitCondition: graph.exitCondition,
    loopBody: graph.loopNodes.map(function(node, i) {
      const instrFn = INSTRUCTIONS[node.agentType];
      return {
        bodyStep: i + 1,
        phaseId: node.id,
        agentType: node.agentType,
        model: node.model,
        tools: node.tools,
        cold: node.cold || false,
        schemaName: node.schemaName || null,
        instruction: instrFn
          ? instrFn(node, Object.assign({}, inputs, { frozenCriteria: frozenCriteria }), null)
          : "(no instruction template for " + node.agentType + ")"
      };
    }),
    instruction: (
      "Run the following loop up to " + maxRounds + " times:\n" +
      "  For each round:\n" +
      "    1. Dispatch: " + loopDescription + "\n" +
      "    2. After the verify step: check verify.pass.\n" +
      "       If true: exit the loop and proceed to the synthesis step.\n" +
      "       If false: collect verify.blockers, pass them to the next build round.\n" +
      "  After " + maxRounds + " rounds without pass: escalate to the human operator.\n" +
      "  Frozen criteria do NOT change between rounds.\n" +
      "  Each verify agent is spawned with cold context: no memory of prior rounds."
    )
  });

  const synthInstrFn = INSTRUCTIONS[graph.synthesis.agentType];
  steps.push({
    step: 2,
    phaseId: graph.synthesis.id,
    nodeType: "agent",
    concurrent: false,
    agentType: graph.synthesis.agentType,
    model: graph.synthesis.model,
    tools: graph.synthesis.tools,
    mcp: [],
    isolation: null,
    cold: false,
    schemaName: null,
    instruction: synthInstrFn
      ? synthInstrFn(graph.synthesis, inputs, null)
      : "Synthesize the review loop result into .octopus/REVIEW-DONE.md.",
    waitFor: "loop exit (pass or budget exhausted) before dispatching synthesis",
    action: null
  });

  return {
    graphId: graph.id,
    graphType: graph.type,
    description: graph.description,
    executionMode: "loop-until-verify",
    maxRounds: maxRounds,
    frozenCriteria: frozenCriteria,
    managerNote: (
      "Run the build-verify loop. Frozen criteria are set at the start and never changed. " +
      "Each verify agent is spawned fresh with no memory of prior rounds. " +
      "Pass only the blocker list to the next builder, not the verifier's reasoning."
    ),
    steps: steps
  };
}

// compile: public entry point

/**
 * Compiles a declarative graph into an ordered list of Manager instructions.
 *
 * @param {object} graph   A graph from graph.js (sprint, team, or review).
 * @param {object} inputs  Runtime inputs: { goal, tasks, criteria, frozenCriteria, artifacts, ... }
 * @returns {object} plan  { graphId, graphType, executionMode, managerNote, steps }
 */
function compile(graph, inputs) {
  inputs = inputs || {};

  if (graph.type === "sequential") {
    return compileSequential(graph, inputs);
  }
  if (graph.type === "parallel") {
    return compileParallel(graph, inputs);
  }
  if (graph.type === "loop") {
    return compileLoop(graph, inputs);
  }

  throw new Error("prose-adapter: unknown graph type: " + graph.type);
}

/**
 * Returns a human-readable summary of a compiled plan.
 * Useful for the Manager to understand the execution order before dispatching.
 */
function summarize(plan) {
  const lines = [
    "Graph: " + plan.graphId + " (" + plan.graphType + ")",
    "Mode: " + plan.executionMode,
    "Note: " + plan.managerNote,
    ""
  ];

  plan.steps.forEach(function(step) {
    if (step.nodeType === "parallel-group") {
      lines.push(
        "Step " + step.step + " [PARALLEL x" + step.concurrency + "]: " +
        step.agents.map(function(a) { return a.agentType; }).join(", ")
      );
    } else if (step.nodeType === "gate") {
      lines.push("Step " + step.step + " [GATE]: " + step.action);
    } else if (step.nodeType === "loop") {
      lines.push(
        "Step " + step.step + " [LOOP x" + step.maxRounds + "]: " +
        step.loopBody.map(function(b) { return b.agentType; }).join(" -> ")
      );
    } else {
      lines.push(
        "Step " + step.step + " [" + (step.agentType || step.nodeType) + "]: " +
        (step.model || "") + " " + (step.cold ? "(cold)" : "")
      );
    }
  });

  return lines.join("\n");
}

// Exports

module.exports = {
  compile,
  summarize
};
