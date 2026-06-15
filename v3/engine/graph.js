"use strict";

/**
 * graph.js: Octopus v3 declarative graph format.
 *
 * Single source of truth for Octopus orchestration graphs.
 * Both adapters (workflow-adapter.js and prose-adapter.js) compile from these
 * data objects. The graphs are pure data: no API calls, no side effects.
 *
 * Graph types:
 *   sequential  Nodes run in order. Each receives the previous node's output.
 *   parallel    Slots run simultaneously, then a synthesis node fans in results.
 *   loop        loopNodes cycle until exitCondition is met or maxRounds is reached.
 *               A synthesis node runs once after the loop exits.
 *
 * Node types:
 *   agent       An agent execution. Has agentType, model, tools, schemaName, etc.
 *   gate        A STOP primitive. Halts for human approval before an irreversible action.
 *               Gate nodes only appear in sequential graphs (sprint).
 *
 * Usage:
 *   const { sprint, team, review } = require('./graph');
 *   const plan = workflowAdapter.compile(sprint, inputs);
 */

// Node factory helpers

/**
 * Creates an agent node.
 *
 * @param {string}   id          Unique node ID within the graph.
 * @param {string}   agentType   "researcher" | "designer" | "maker" | "marketer" | "manager" | "verifier"
 * @param {string}   model       Model ID to use for this node.
 * @param {string}   schemaName  Name of the handoff schema that validates this node's output.
 *                               Pass null for nodes that produce prose (market, synthesis).
 * @param {string[]} tools       Allowlisted tools for this node.
 * @param {object}   options     Optional: { mcp, isolation, cold }
 */
function agentNode(id, agentType, model, schemaName, tools, options) {
  const opts = options || {};
  return {
    id,
    nodeType: "agent",
    agentType,
    model,
    schemaName: schemaName || null,
    tools: tools || [],
    mcp: opts.mcp || [],
    isolation: opts.isolation || null,
    cold: opts.cold || false
  };
}

/**
 * Creates a gate node.
 * Gate nodes halt execution for human approval before an irreversible action.
 *
 * @param {string} id          Unique node ID.
 * @param {string} action      Action being gated: "deploy", "publish-distribution", etc.
 * @param {string} description Human-readable description of what is being gated.
 */
function gateNode(id, action, description) {
  return {
    id,
    nodeType: "gate",
    action,
    description
  };
}

// Canonical agent routing table (mirrors v3/agents/*.md frontmatter)

const AGENT_ROUTING = {
  researcher: {
    agentType: "researcher",
    model: "claude-haiku-4-5",
    tools: ["Read", "WebSearch", "WebFetch", "Bash"],
    mcp: [],
    isolation: null,
    cold: false
  },
  designer: {
    agentType: "designer",
    model: "claude-sonnet-4-6",
    tools: ["Read", "Write", "Edit"],
    mcp: [],
    isolation: null,
    cold: false
  },
  maker: {
    agentType: "maker",
    model: "claude-sonnet-4-6",
    tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    mcp: ["cloudflare-pages", "stripe"],
    isolation: "worktree",
    cold: false
  },
  verifier: {
    agentType: "verifier",
    model: "claude-sonnet-4-6",
    tools: ["Read"],
    mcp: [],
    isolation: null,
    cold: true
  },
  marketer: {
    agentType: "marketer",
    model: "claude-haiku-4-5",
    tools: ["Read", "Write"],
    mcp: [],
    isolation: null,
    cold: false
  },
  manager: {
    agentType: "manager",
    model: "claude-opus-4-8",
    tools: ["Read", "Write"],
    mcp: [],
    isolation: null,
    cold: false
  }
};

// sprint graph: sequential pipeline
//
// Stages: research -> design -> build -> verify -> gate(deploy) -> market -> gate(distribution) -> synthesis
//
// research:          Haiku fan-out; cheap, wide. Halts sprint on KILL recommendation.
// design:            Sonnet; solution design from research brief. Decisions are locked after this stage.
// build:             Sonnet; worktree isolation; deploy MCP available but gated.
// verify:            Cold Sonnet; read-only; fresh context; mandatory security scan.
// gate-deploy:       Human approval required before any deploy action.
// market:            Haiku drafts; no publish action; permanently gated for distribution.
// gate-distribution: Human approval required before any distribution action.
// synthesis:         Opus; Manager produces SPRINT-DONE.md.

const sprint = {
  id: "sprint",
  type: "sequential",
  version: "3.0.0",
  description: "Full sequential pipeline: research -> design -> build -> verify -> [gate] -> market -> synthesis",
  nodes: [
    agentNode(
      "research",
      "researcher",
      "claude-haiku-4-5",
      "researchHandoff",
      ["Read", "WebSearch", "WebFetch", "Bash"]
    ),
    agentNode(
      "design",
      "designer",
      "claude-sonnet-4-6",
      "designHandoff",
      ["Read", "Write", "Edit"]
    ),
    agentNode(
      "build",
      "maker",
      "claude-sonnet-4-6",
      "buildHandoff",
      ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      { mcp: ["cloudflare-pages", "stripe"], isolation: "worktree" }
    ),
    agentNode(
      "verify",
      "verifier",
      "claude-sonnet-4-6",
      "verifyVerdict",
      ["Read"],
      { cold: true }
    ),
    gateNode(
      "gate-deploy",
      "deploy",
      "Human approval required before deploying build artifacts to Cloudflare Pages"
    ),
    agentNode(
      "market",
      "marketer",
      "claude-haiku-4-5",
      null,
      ["Read", "Write"]
    ),
    gateNode(
      "gate-distribution",
      "publish-distribution",
      "Human approval required before any distribution action. Octopus drafts; a human sends."
    ),
    agentNode(
      "synthesis",
      "manager",
      "claude-opus-4-8",
      null,
      ["Read", "Write"]
    )
  ]
};

// team graph: parallel fan-out / fan-in
//
// Slots run simultaneously. Manager fans in results.
// The caller provides task descriptions; the adapter maps each slot to a task.
// Slots define the maximum concurrency and the agent type for each position.

const team = {
  id: "team",
  type: "parallel",
  version: "3.0.0",
  description: "Parallel fan-out: independent tasks dispatch simultaneously, Manager fans in results",
  slots: [
    agentNode(
      "slot-research",
      "researcher",
      "claude-haiku-4-5",
      "teamResult",
      ["Read", "WebSearch", "WebFetch", "Bash"]
    ),
    agentNode(
      "slot-design",
      "designer",
      "claude-sonnet-4-6",
      "teamResult",
      ["Read", "Write", "Edit"]
    ),
    agentNode(
      "slot-build",
      "maker",
      "claude-sonnet-4-6",
      "teamResult",
      ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      { mcp: ["cloudflare-pages", "stripe"] }
    ),
    agentNode(
      "slot-market",
      "marketer",
      "claude-haiku-4-5",
      "teamResult",
      ["Read", "Write"]
    )
  ],
  synthesis: agentNode(
    "team-synthesis",
    "manager",
    "claude-opus-4-8",
    null,
    ["Read", "Write"]
  )
};

// review graph: loop until cold verifier passes
//
// loopNodes run in sequence each round: build -> verify.
// exitCondition is evaluated after each verify node.
// synthesis runs once after the loop exits (pass or budget exhausted).

const review = {
  id: "review",
  type: "loop",
  version: "3.0.0",
  description: "Adversarial review loop: builder revises until cold verifier passes or budget exhausted",
  maxRounds: 3,
  exitCondition: "verify.pass === true",
  loopNodes: [
    agentNode(
      "build",
      "maker",
      "claude-sonnet-4-6",
      "revisionHandoff",
      ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
    ),
    agentNode(
      "verify",
      "verifier",
      "claude-sonnet-4-6",
      "verifyVerdict",
      ["Read"],
      { cold: true }
    )
  ],
  synthesis: agentNode(
    "review-synthesis",
    "manager",
    "claude-opus-4-8",
    null,
    ["Read", "Write"]
  )
};

// Graph utility helpers

/**
 * Returns all agent-type nodes in a graph, flattened regardless of graph type.
 * Gate nodes are excluded. Useful for tooling that enumerates agents without
 * branching on graph type.
 */
function getAllAgentNodes(graph) {
  if (graph.type === "sequential") {
    return graph.nodes.filter(function(n) { return n.nodeType === "agent"; });
  }
  if (graph.type === "parallel") {
    return graph.slots.concat([graph.synthesis]).filter(function(n) {
      return n.nodeType === "agent";
    });
  }
  if (graph.type === "loop") {
    return graph.loopNodes.concat([graph.synthesis]).filter(function(n) {
      return n.nodeType === "agent";
    });
  }
  return [];
}

/**
 * Returns all gate nodes in a graph.
 * Gate nodes only appear in sequential graphs; returns [] for other types.
 */
function getGateNodes(graph) {
  if (graph.type !== "sequential") return [];
  return graph.nodes.filter(function(n) { return n.nodeType === "gate"; });
}

/**
 * Returns the deduplicated list of agentTypes used in a graph.
 */
function getAgentTypes(graph) {
  const nodes = getAllAgentNodes(graph);
  const seen = {};
  const result = [];
  for (let i = 0; i < nodes.length; i += 1) {
    if (!seen[nodes[i].agentType]) {
      seen[nodes[i].agentType] = true;
      result.push(nodes[i].agentType);
    }
  }
  return result;
}

/**
 * Looks up a built-in graph by ID. Returns undefined if not found.
 */
function getGraph(id) {
  const graphs = { sprint: sprint, team: team, review: review };
  return graphs[id];
}

// Exports

module.exports = {
  sprint,
  team,
  review,
  AGENT_ROUTING,
  agentNode,
  gateNode,
  getAllAgentNodes,
  getGateNodes,
  getAgentTypes,
  getGraph
};
