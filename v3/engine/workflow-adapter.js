"use strict";

/**
 * workflow-adapter.js: Compiles an Octopus declarative graph into the Workflow API.
 *
 * IMPORTANT: Workflow API status: research-preview (June 2026).
 * Primitives expected as globals in the Workflow runtime:
 *   pipeline(), parallel(), phase(), agent(), log()
 *
 * THIS IS THE ONLY FILE IN OCTOPUS THAT REFERENCES THE WORKFLOW API DIRECTLY.
 * Blast radius if API signatures change at GA: this file only.
 *
 * This file does NOT call any Workflow API at import time.
 * All API calls are inside exported functions that are only invoked at runtime
 * from within a Workflow script context.
 *
 * Two public exports:
 *   compile(graph, inputs)           Returns a static plan object (pure data, no side effects).
 *                                    Safe to call from any environment.
 *   execute(graph, inputs, opts)     Compiles and executes using Workflow globals.
 *                                    Call ONLY from a Workflow script that has
 *                                    pipeline(), parallel(), phase(), agent(), log() in scope.
 *   isWorkflowPresent()              Returns true if Workflow globals are available.
 */

const graphModule = require("./graph");

// Runtime detection

/**
 * Returns true if the Workflow runtime globals are available.
 * Safe to call at any time: typeof does not throw on undeclared variables.
 */
function isWorkflowPresent() {
  return (
    typeof pipeline === "function" &&
    typeof parallel === "function" &&
    typeof phase === "function" &&
    typeof agent === "function"
  );
}

// compile: produce a static plan (pure data, no execution)

/**
 * Compiles a declarative graph into a static Workflow-shaped plan.
 * Returns an object describing each step, the Workflow call pattern to use,
 * the agent configuration, and the execution order.
 *
 * The plan is pure data: it can be inspected, logged, or tested without
 * a live Workflow runtime.
 *
 * @param {object} graph  A graph object from graph.js (sprint, team, or review).
 * @param {object} inputs Runtime inputs: { goal, tasks, task, criteria, ... }
 * @returns {object} plan  { graphId, graphType, steps, gateCount, agentCount }
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

  throw new Error("workflow-adapter: unknown graph type: " + graph.type);
}

function compileSequential(graph, inputs) {
  const steps = [];

  for (let i = 0; i < graph.nodes.length; i += 1) {
    const node = graph.nodes[i];

    if (node.nodeType === "agent") {
      steps.push({
        stepIndex: i,
        phaseId: node.id,
        nodeType: "agent",
        agentType: node.agentType,
        model: node.model,
        tools: node.tools,
        mcp: node.mcp,
        isolation: node.isolation,
        cold: node.cold,
        schemaName: node.schemaName,
        workflowPattern: buildAgentPhasePattern(node)
      });
    } else if (node.nodeType === "gate") {
      steps.push({
        stepIndex: i,
        phaseId: node.id,
        nodeType: "gate",
        action: node.action,
        description: node.description,
        workflowPattern: 'await gate("' + node.action + '", context)'
      });
    }
  }

  return {
    graphId: graph.id,
    graphType: graph.type,
    description: graph.description,
    steps: steps,
    agentCount: steps.filter(function(s) { return s.nodeType === "agent"; }).length,
    gateCount: steps.filter(function(s) { return s.nodeType === "gate"; }).length
  };
}

function compileParallel(graph, inputs) {
  const slotSteps = graph.slots.map(function(slot, i) {
    return {
      stepIndex: i,
      phaseId: slot.id,
      nodeType: "agent",
      agentType: slot.agentType,
      model: slot.model,
      tools: slot.tools,
      mcp: slot.mcp,
      isolation: slot.isolation,
      cold: slot.cold,
      schemaName: slot.schemaName,
      workflowPattern: buildAgentPhasePattern(slot)
    };
  });

  const synthStep = {
    stepIndex: graph.slots.length,
    phaseId: graph.synthesis.id,
    nodeType: "agent",
    agentType: graph.synthesis.agentType,
    model: graph.synthesis.model,
    tools: graph.synthesis.tools,
    schemaName: null,
    workflowPattern: buildAgentPhasePattern(graph.synthesis)
  };

  return {
    graphId: graph.id,
    graphType: graph.type,
    description: graph.description,
    fanOut: {
      concurrency: graph.slots.length,
      slots: slotSteps,
      workflowPattern: "await parallel(slots.map(slot => phase(slot.id, async () => agent({...slot}))))"
    },
    fanIn: synthStep,
    agentCount: slotSteps.length + 1,
    gateCount: 0
  };
}

function compileLoop(graph, inputs) {
  const loopSteps = graph.loopNodes.map(function(node, i) {
    return {
      stepIndex: i,
      phaseId: node.id,
      nodeType: "agent",
      agentType: node.agentType,
      model: node.model,
      tools: node.tools,
      cold: node.cold,
      schemaName: node.schemaName,
      workflowPattern: buildAgentPhasePattern(node)
    };
  });

  const synthStep = {
    stepIndex: graph.loopNodes.length,
    phaseId: graph.synthesis.id,
    nodeType: "agent",
    agentType: graph.synthesis.agentType,
    model: graph.synthesis.model,
    tools: graph.synthesis.tools,
    schemaName: null,
    workflowPattern: buildAgentPhasePattern(graph.synthesis)
  };

  return {
    graphId: graph.id,
    graphType: graph.type,
    description: graph.description,
    maxRounds: graph.maxRounds,
    exitCondition: graph.exitCondition,
    loop: {
      steps: loopSteps,
      workflowPattern: "while (round < maxRounds) { for each loopNode: await phase(phaseId, async () => agent({...})) }"
    },
    synthesis: synthStep,
    agentCount: loopSteps.length + 1,
    gateCount: 0
  };
}

function buildAgentPhasePattern(node) {
  const toolList = JSON.stringify(node.tools);
  const coldSuffix = node.cold ? ', context: "cold"' : "";
  const isolationSuffix = node.isolation ? ', isolation: "' + node.isolation + '"' : "";
  return (
    'await phase("' + node.id + '", async () =>' +
    ' agent({ model: "' + node.model + '", tools: ' + toolList +
    coldSuffix + isolationSuffix + ', schema: ' + (node.schemaName || "null") + " }))"
  );
}

// execute: run the plan using Workflow globals
//
// Call ONLY from within a Workflow script. The Workflow runtime provides:
//   pipeline(), parallel(), phase(), agent(), log() as globals.
//
// For sequential graphs (sprint): runs each node as a phase in order.
//   Gate nodes pause for human approval via gate().
// For parallel graphs (team): fans out all slots with parallel(), then synthesizes.
// For loop graphs (review): runs loopNodes in a while loop until exit, then synthesizes.

/**
 * Executes a compiled graph using the Workflow runtime globals.
 *
 * @param {object} graph   A graph from graph.js.
 * @param {object} inputs  Runtime inputs (goal, tasks, criteria, etc.).
 * @param {object} opts    Optional: { systemPrompts, frozenCriteria, onGate, schemas }
 * @returns {Promise<object>} Collected stage outputs.
 */
async function execute(graph, inputs, opts) {
  if (!isWorkflowPresent()) {
    throw new Error(
      "workflow-adapter.execute(): Workflow globals (pipeline, parallel, phase, agent, log) " +
      "are not present. Use prose-adapter instead, or call execute() only from a Workflow script."
    );
  }

  inputs = inputs || {};
  opts = opts || {};

  if (graph.type === "sequential") {
    return executeSequential(graph, inputs, opts);
  }
  if (graph.type === "parallel") {
    return executeParallel(graph, inputs, opts);
  }
  if (graph.type === "loop") {
    return executeLoop(graph, inputs, opts);
  }

  throw new Error("workflow-adapter.execute(): unknown graph type: " + graph.type);
}

async function executeSequential(graph, inputs, opts) {
  const outputs = {};
  const systemPrompts = opts.systemPrompts || {};

  for (let i = 0; i < graph.nodes.length; i += 1) {
    const node = graph.nodes[i];

    if (node.nodeType === "gate") {
      log("[gate] " + node.description);
      if (typeof opts.onGate === "function") {
        await opts.onGate(node.action, { node: node, outputs: outputs });
      } else {
        await gate(node.action, { node: node, outputs: outputs });
      }
      continue;
    }

    const agentConfig = {
      model: node.model,
      tools: node.tools
    };

    if (node.cold) {
      agentConfig.context = "cold";
    }
    if (node.isolation) {
      agentConfig.isolation = node.isolation;
    }
    if (node.mcp && node.mcp.length > 0) {
      agentConfig.mcp = node.mcp;
    }
    if (node.schemaName && opts.schemas && opts.schemas[node.schemaName]) {
      agentConfig.schema = opts.schemas[node.schemaName];
    }
    if (systemPrompts[node.id]) {
      agentConfig.systemPrompt = systemPrompts[node.id];
    }

    log("[" + node.id + "] Spawning " + node.agentType + " (" + node.model + ")");

    const result = await phase(node.id, async function() {
      return await agent(agentConfig);
    });

    outputs[node.id] = result;

    if (node.id === "research" && result && result.recommendation === "KILL") {
      throw new Error(
        "Sprint killed by research stage. " +
        (result.opportunity ? result.opportunity.rationale : "No rationale provided.")
      );
    }

    if (node.id === "verify" && result && result.pass === false) {
      const blockers = (result.blockers || []).join("; ");
      throw new Error(
        "Sprint blocked by verify stage. Blockers: " + blockers +
        ". Fix these and re-run the build stage."
      );
    }
  }

  return outputs;
}

async function executeParallel(graph, inputs, opts) {
  const systemPrompts = opts.systemPrompts || {};
  const tasks = inputs.tasks || [];

  log("[team] Dispatching " + tasks.length + " tasks in parallel");

  const results = await parallel(
    tasks.map(function(task, i) {
      const slot = graph.slots[i % graph.slots.length];
      if (!slot) return Promise.resolve(null);

      const agentConfig = {
        model: slot.model,
        tools: slot.tools
      };
      if (slot.mcp && slot.mcp.length > 0) {
        agentConfig.mcp = slot.mcp;
      }
      if (systemPrompts[task.id] || systemPrompts[slot.id]) {
        agentConfig.systemPrompt = systemPrompts[task.id] || systemPrompts[slot.id];
      }
      if (opts.schemas && opts.schemas[slot.schemaName]) {
        agentConfig.schema = opts.schemas[slot.schemaName];
      }

      return phase("task-" + task.id, async function() {
        log("[team] Starting " + task.id + " (" + slot.agentType + ")");
        return await agent(agentConfig);
      });
    })
  );

  const synthConfig = {
    model: graph.synthesis.model,
    tools: graph.synthesis.tools
  };
  if (systemPrompts["synthesis"] || systemPrompts[graph.synthesis.id]) {
    synthConfig.systemPrompt = systemPrompts["synthesis"] || systemPrompts[graph.synthesis.id];
  }

  const synthesis = await phase(graph.synthesis.id, async function() {
    log("[team-synthesis] Spawning Manager synthesis: " + graph.synthesis.model);
    return await agent(synthConfig);
  });

  return { results: results, synthesis: synthesis };
}

async function executeLoop(graph, inputs, opts) {
  const systemPrompts = opts.systemPrompts || {};
  const frozenCriteria = opts.frozenCriteria || inputs.criteria || [];
  const maxRounds = graph.maxRounds || 3;

  let round = 0;
  let lastVerdict = null;
  let priorBlockers = [];
  let currentArtifacts = inputs.artifacts || [];

  while (round < maxRounds) {
    round += 1;
    log("[review] Round " + round + "/" + maxRounds);

    for (let i = 0; i < graph.loopNodes.length; i += 1) {
      const node = graph.loopNodes[i];
      const agentConfig = {
        model: node.model,
        tools: node.tools
      };
      if (node.cold) {
        agentConfig.context = "cold";
      }
      if (systemPrompts[node.id + "-round-" + round] || systemPrompts[node.id]) {
        agentConfig.systemPrompt = (
          systemPrompts[node.id + "-round-" + round] || systemPrompts[node.id]
        );
      }
      if (opts.schemas && opts.schemas[node.schemaName]) {
        agentConfig.schema = opts.schemas[node.schemaName];
      }

      const phaseId = node.id + "-round-" + round;
      const result = await phase(phaseId, async function() {
        log("[" + phaseId + "] Spawning " + node.agentType);
        return await agent(agentConfig);
      });

      if (node.id === "verify") {
        lastVerdict = result;
        if (result && result.pass) {
          log("[review] Passed on round " + round + ". Exiting loop.");
          round = maxRounds;
          break;
        }
        priorBlockers = (result && result.blockers) ? result.blockers : [];
      } else if (node.id === "build") {
        currentArtifacts = (result && result.artifacts) ? result.artifacts : currentArtifacts;
      }
    }
  }

  const passedClean = lastVerdict && lastVerdict.pass;

  const synthConfig = {
    model: graph.synthesis.model,
    tools: graph.synthesis.tools
  };
  if (systemPrompts[graph.synthesis.id]) {
    synthConfig.systemPrompt = systemPrompts[graph.synthesis.id];
  }

  const synthesis = await phase(graph.synthesis.id, async function() {
    log("[review-synthesis] Spawning Manager synthesis: " + graph.synthesis.model);
    return await agent(synthConfig);
  });

  return {
    passed: passedClean,
    rounds: round,
    artifacts: currentArtifacts,
    lastVerdict: lastVerdict,
    synthesis: synthesis
  };
}

// Exports

module.exports = {
  isWorkflowPresent,
  compile,
  execute
};
