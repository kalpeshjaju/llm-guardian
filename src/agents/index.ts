/**
 * FILE PURPOSE: Agents module exports
 *
 * CONTEXT: Multi-Agent Evolve (MAE) pattern implementation
 *
 * AGENTS:
 * - Proposer: Generate fix suggestions using LLM
 * - Solver: Apply fixes automatically
 * - Judge: Validate fixes (future)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

export { ProposerAgent } from './proposer.js';
export { SolverAgent } from './solver.js';
export type { FixResult } from './solver.js';
