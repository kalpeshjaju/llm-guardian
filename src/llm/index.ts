/**
 * FILE PURPOSE: LLM module exports
 *
 * CONTEXT: Central export point for LLM provider functionality
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

// Types
export type {
  ILLMProvider,
  LLMContext,
  LLMResponse,
  LLMProviderConfig,
  PromptTemplate,
} from './types.js';

// Providers
export { CLIProvider } from './cli-provider.js';

// Utilities
export {
  buildPrompt,
  buildQuickPrompt,
  extractSurroundingLines,
  parseConfidence,
} from './prompts.js';
