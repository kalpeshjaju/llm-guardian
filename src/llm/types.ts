/**
 * FILE PURPOSE: LLM provider type definitions
 *
 * CONTEXT: Abstraction layer for different LLM providers (Claude CLI, OpenAI API, etc.)
 * Enables swappable LLM backends for fix suggestions.
 *
 * DEPENDENCIES: None (pure types)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import type { Issue } from '../detectors/types.js';

/**
 * LLM provider interface
 *
 * WHY: Abstract LLM provider for swappable backends
 * HOW: Define contract for generating fix suggestions
 *
 * PROVIDERS:
 * - CLIProvider: Uses `claude chat` command (Option B, no API cost)
 * - AnthropicProvider: Uses Anthropic API (future, requires API key)
 * - OpenAIProvider: Uses OpenAI API (future, requires API key)
 */
export interface ILLMProvider {
  /** Provider name (e.g., 'claude-cli', 'openai-api') */
  readonly name: string;

  /**
   * Generate fix suggestion for an issue
   *
   * @param issue - Issue to generate fix for
   * @param context - Additional context (file content, related code)
   * @returns Fix suggestion or null if cannot generate
   */
  generateFix(issue: Issue, context: LLMContext): Promise<LLMResponse | null>;

  /**
   * Check if provider is available
   *
   * WHY: Verify CLI is installed or API key is set
   * HOW: Run health check (e.g., `claude --version`)
   *
   * @returns true if provider is ready to use
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Context provided to LLM for fix generation
 *
 * WHY: LLM needs surrounding code to understand context
 * HOW: Provide file content, line ranges, related issues
 */
export interface LLMContext {
  /** Full file content */
  fileContent: string;

  /** File path (for context) */
  filePath: string;

  /** File extension (e.g., '.ts', '.js') */
  fileExtension: string;

  /** Lines around the issue (for focused context) */
  surroundingLines?: {
    before: string[];
    issue: string;
    after: string[];
  };

  /** Related issues in same file (for holistic fixes) */
  relatedIssues?: Issue[];

  /** Project-level context (optional) */
  projectInfo?: {
    packageJson?: string;
    framework?: string;
    language?: string;
  };
}

/**
 * LLM response with fix suggestion
 */
export interface LLMResponse {
  /** Whether fix generation succeeded */
  success: boolean;

  /** Generated fix (code to replace) */
  fix?: {
    /** Type of fix */
    type: 'string-replace' | 'line-replace' | 'insert' | 'delete';

    /** Original code to find */
    search: string;

    /** Replacement code */
    replace: string;

    /** Confidence score (0-1) */
    confidence: number;

    /** Explanation of the fix */
    explanation: string;
  };

  /** Alternative suggestion (if cannot provide direct fix) */
  suggestion?: string;

  /** Error message (if generation failed) */
  error?: string;

  /** Metadata (execution time, model used, etc.) */
  metadata?: {
    provider: string;
    model?: string;
    executionTimeMs?: number;
    tokensUsed?: number;
  };
}

/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
  /** Provider name */
  provider: 'claude-cli' | 'anthropic-api' | 'openai-api';

  /** API key (for API-based providers) */
  apiKey?: string;

  /** Model to use (e.g., 'claude-3-5-sonnet-20241022') */
  model?: string;

  /** Max tokens for response */
  maxTokens?: number;

  /** Temperature (creativity) */
  temperature?: number;

  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Prompt template for fix generation
 *
 * WHY: Different issue types need different prompts
 * HOW: Template with placeholders for issue details
 */
export interface PromptTemplate {
  /** Issue category this template is for */
  category: 'hallucination' | 'code-quality' | 'requirements' | 'architecture';

  /** System prompt (sets behavior) */
  system: string;

  /** User prompt template (filled with issue details) */
  user: string;
}
