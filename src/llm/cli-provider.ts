/**
 * FILE PURPOSE: CLI-based LLM provider using claude chat
 *
 * CONTEXT: Option B implementation - uses `claude chat` command instead of API.
 * Benefits: No API cost, reuses existing Claude Code installation.
 * Trade-offs: Requires Claude Code CLI, slightly slower than direct API.
 *
 * DEPENDENCIES:
 * - child_process: Execute claude chat command
 * - prompts: Prompt templates
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ILLMProvider, LLMContext, LLMResponse } from './types.js';
import type { Issue } from '../detectors/types.js';
import { buildPrompt } from './prompts.js';

const execAsync = promisify(exec);

/**
 * CLI Provider - Uses claude chat command
 *
 * WHY: Leverage existing Claude Code installation (no API costs)
 * HOW: Execute `claude chat` with prompts, parse responses
 *
 * REQUIREMENTS:
 * - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
 * - User must be logged in (`claude auth login`)
 *
 * PERFORMANCE:
 * - Slower than direct API (~2-3s per fix vs ~1s)
 * - But free and reuses existing setup
 *
 * RELIABILITY:
 * - Depends on CLI stability
 * - May fail if CLI not installed or auth expired
 * - Has built-in fallbacks (returns null on failure)
 */
export class CLIProvider implements ILLMProvider {
  readonly name = 'claude-cli';

  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  /**
   * Create CLI provider
   *
   * @param options - Provider options
   */
  constructor(options: {
    timeoutMs?: number;
    maxRetries?: number;
  } = {}) {
    this.timeoutMs = options.timeoutMs || 10000; // 10s timeout
    this.maxRetries = options.maxRetries || 1; // 1 retry
  }

  /**
   * Check if claude CLI is available
   *
   * WHY: Fail fast if CLI not installed
   * HOW: Run `claude --version`
   *
   * @returns true if CLI available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { stdout, stderr } = await execAsync('claude --version', {
        timeout: 5000,
      });

      // Check if version output looks valid
      const output = stdout + stderr;
      return output.includes('claude') || output.includes('version');

    } catch (error) {
      // CLI not installed or not in PATH
      return false;
    }
  }

  /**
   * Generate fix suggestion using claude chat
   *
   * WHY: Use LLM intelligence to suggest context-aware fixes
   * HOW: Build prompt → Execute claude chat → Parse response
   *
   * @param issue - Issue to fix
   * @param context - Code context
   * @returns Fix suggestion or null
   *
   * FLOW:
   * 1. Build prompt with issue + context
   * 2. Execute `claude chat` with prompt
   * 3. Parse response for fix suggestion
   * 4. Return structured fix or null
   *
   * ERROR HANDLING:
   * - CLI not available: Return null
   * - Timeout: Return null (after retry)
   * - Parse failure: Return null with error
   *
   * EXAMPLE:
   * ```typescript
   * const provider = new CLIProvider();
   * const response = await provider.generateFix(issue, context);
   * // response = {
   * //   success: true,
   * //   fix: { type: 'string-replace', search: '...', replace: '...', confidence: 0.9 }
   * // }
   * ```
   */
  async generateFix(issue: Issue, context: LLMContext): Promise<LLMResponse | null> {
    const startTime = Date.now();

    try {
      // Step 1: Check if CLI available
      if (!(await this.isAvailable())) {
        return {
          success: false,
          error: 'Claude CLI not available. Install with: npm install -g @anthropic-ai/claude-code',
          metadata: {
            provider: this.name,
            executionTimeMs: Date.now() - startTime,
          },
        };
      }

      // Step 2: Build prompt
      const prompt = buildPrompt(issue, context);

      // Step 3: Execute claude chat
      const response = await this.executeClaude(prompt);

      // Step 4: Parse response
      const fix = this.parseResponse(response, issue);

      if (!fix) {
        return {
          success: false,
          error: 'Failed to parse fix from LLM response',
          suggestion: response.substring(0, 200), // Return first 200 chars as fallback
          metadata: {
            provider: this.name,
            executionTimeMs: Date.now() - startTime,
          },
        };
      }

      return {
        success: true,
        fix,
        metadata: {
          provider: this.name,
          model: 'claude-3-5-sonnet-20241022', // CLI uses latest Sonnet
          executionTimeMs: Date.now() - startTime,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          provider: this.name,
          executionTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Execute claude chat command
   *
   * WHY: Run CLI command with proper error handling
   * HOW: Use exec with timeout and retry logic
   *
   * @param prompt - Prompt to send to Claude
   * @returns Claude's response text
   * @throws Error if execution fails after retries
   */
  private async executeClaude(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Escape prompt for shell (handle quotes, newlines)
        const escapedPrompt = prompt
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n');

        // Execute claude chat
        const { stdout, stderr } = await execAsync(
          `echo "${escapedPrompt}" | claude chat --no-stream`,
          {
            timeout: this.timeoutMs,
            maxBuffer: 1024 * 1024, // 1MB buffer
          }
        );

        // Check for errors in stderr
        if (stderr && stderr.toLowerCase().includes('error')) {
          throw new Error(`Claude CLI error: ${stderr}`);
        }

        return stdout.trim();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on timeout (likely won't help)
        if (lastError.message.includes('timeout')) {
          break;
        }

        // Retry on other errors
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
          continue;
        }
      }
    }

    throw lastError || new Error('Failed to execute claude chat');
  }

  /**
   * Parse LLM response into structured fix
   *
   * WHY: Extract fix details from natural language response
   * HOW: Look for code blocks and fix patterns
   *
   * @param response - Raw LLM response
   * @param issue - Original issue
   * @returns Parsed fix or null
   *
   * PARSING STRATEGY:
   * 1. Look for code blocks (```...```)
   * 2. Extract "before" and "after" code
   * 3. Build string-replace fix
   * 4. Estimate confidence based on response quality
   *
   * FORMATS SUPPORTED:
   * - Code blocks with before/after
   * - Inline suggestions with arrows (old → new)
   * - Descriptive fixes (extract from text)
   */
  private parseResponse(response: string, issue: Issue): LLMResponse['fix'] | null {
    try {
      // Strategy 1: Look for code blocks
      const codeBlockRegex = /```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/g;
      const codeBlocks: string[] = [];
      let match;

      while ((match = codeBlockRegex.exec(response)) !== null) {
        if (match[1]) {
          codeBlocks.push(match[1].trim());
        }
      }

      // If we have 2 code blocks, assume before/after
      if (codeBlocks.length === 2 && codeBlocks[0] && codeBlocks[1]) {
        return {
          type: 'llm-generated',
          search: codeBlocks[0],
          replace: codeBlocks[1],
          confidence: 0.85,
          explanation: this.extractExplanation(response),
        };
      }

      // If we have 1 code block, use as replacement
      if (codeBlocks.length === 1 && codeBlocks[0] && issue.evidence) {
        return {
          type: 'llm-generated',
          search: issue.evidence,
          replace: codeBlocks[0],
          confidence: 0.75,
          explanation: this.extractExplanation(response),
        };
      }

      // Strategy 2: Look for arrow notation (old → new)
      const arrowRegex = /(?:change|replace|use)\s+`([^`]+)`\s+(?:to|with|→)\s+`([^`]+)`/i;
      const arrowMatch = response.match(arrowRegex);

      if (arrowMatch && arrowMatch[1] && arrowMatch[2]) {
        return {
          type: 'llm-generated',
          search: arrowMatch[1],
          replace: arrowMatch[2],
          confidence: 0.7,
          explanation: this.extractExplanation(response),
        };
      }

      // Strategy 3: Extract from structured format (if present)
      const structuredRegex = /SEARCH:\s*```[\s\S]*?```\s*REPLACE:\s*```[\s\S]*?```/;
      if (structuredRegex.test(response)) {
        const searchMatch = response.match(/SEARCH:\s*```(?:[\w]*\n)?([\s\S]*?)```/);
        const replaceMatch = response.match(/REPLACE:\s*```(?:[\w]*\n)?([\s\S]*?)```/);

        if (searchMatch && searchMatch[1] && replaceMatch && replaceMatch[1]) {
          return {
            type: 'llm-generated',
            search: searchMatch[1].trim(),
            replace: replaceMatch[1].trim(),
            confidence: 0.9,
            explanation: this.extractExplanation(response),
          };
        }
      }

      // Could not parse structured fix
      return null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Extract explanation from LLM response
   *
   * WHY: Provide context for why the fix is suggested
   * HOW: Take first sentence or paragraph before code blocks
   *
   * @param response - LLM response
   * @returns Explanation text
   */
  private extractExplanation(response: string): string {
    // Remove code blocks for explanation extraction
    const withoutCodeBlocks = response.replace(/```[\s\S]*?```/g, '');

    // Take first 200 characters or first paragraph
    const firstParagraph = withoutCodeBlocks.split('\n\n')[0];
    const explanation = firstParagraph?.substring(0, 200).trim() || 'LLM-suggested fix';

    return explanation;
  }
}

export default CLIProvider;
