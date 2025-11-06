/**
 * FILE PURPOSE: Prompt templates for LLM fix generation
 *
 * CONTEXT: Carefully crafted prompts for generating high-quality, structured fixes.
 * Different prompts for different issue categories (hallucination vs code-quality).
 *
 * DEPENDENCIES: None (pure prompt templates)
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import type { Issue } from '../detectors/types.js';
import type { LLMContext } from './types.js';

/**
 * Build prompt for fix generation
 *
 * WHY: LLM needs clear, structured prompts for consistent output
 * HOW: Select template based on category, fill with issue details
 *
 * @param issue - Issue to generate fix for
 * @param context - Code context
 * @returns Formatted prompt string
 *
 * PROMPT STRUCTURE:
 * 1. System: Sets behavior (be concise, structured)
 * 2. Issue context: Category, severity, message
 * 3. Code context: File, evidence, surrounding code
 * 4. Output format: Specific format for parsing
 *
 * EXAMPLE:
 * ```typescript
 * const prompt = buildPrompt(issue, context);
 * // prompt = "You are a code fix assistant...\n\nFILE: foo.ts\nISSUE: ..."
 * ```
 */
export function buildPrompt(issue: Issue, context: LLMContext): string {
  const template = getTemplateForCategory(issue.category);

  // Build context section
  const contextSection = buildContextSection(issue, context);

  // Build output format section
  const outputFormat = buildOutputFormat();

  // Combine all sections
  return `${template.system}

${contextSection}

${outputFormat}`;
}

/**
 * Get prompt template for issue category
 *
 * WHY: Different categories need different approaches
 * HOW: Select template based on category
 *
 * @param category - Issue category
 * @returns Prompt template
 */
function getTemplateForCategory(
  category: 'hallucination' | 'code-quality' | 'requirements' | 'architecture'
): { system: string; focus: string } {
  switch (category) {
    case 'hallucination':
      return {
        system: `You are a code fix assistant specializing in correcting LLM-generated code mistakes.

Your task: Generate a precise code fix for the issue below.

RULES:
- Provide ONLY the exact code change needed (no explanations unless asked)
- Preserve existing code style and formatting
- Fix only the specific issue (don't refactor unrelated code)
- Ensure the fix is backwards compatible
- Output in the structured format specified`,
        focus: 'hallucination',
      };

    case 'code-quality':
      return {
        system: `You are a code quality improvement assistant.

Your task: Generate a code fix that improves code quality while maintaining functionality.

RULES:
- Provide ONLY the exact code change needed
- Preserve existing logic and behavior
- Improve quality without breaking changes
- Follow TypeScript best practices
- Output in the structured format specified`,
        focus: 'code-quality',
      };

    default:
      return {
        system: `You are a code fix assistant.

Your task: Generate a precise code fix for the issue below.

RULES:
- Provide ONLY the exact code change needed
- Preserve existing functionality
- Output in the structured format specified`,
        focus: 'general',
      };
  }
}

/**
 * Build context section of prompt
 *
 * WHY: LLM needs full context to generate accurate fixes
 * HOW: Include file, issue details, evidence, surrounding code
 *
 * @param issue - Issue
 * @param context - Code context
 * @returns Context section string
 */
function buildContextSection(issue: Issue, context: LLMContext): string {
  const sections: string[] = [];

  // Issue details
  sections.push(`ISSUE DETAILS:
Category: ${issue.category}
Severity: ${issue.severity}
Message: ${issue.message}
${issue.suggestion ? `Suggestion: ${issue.suggestion}` : ''}`);

  // File context
  sections.push(`FILE CONTEXT:
Path: ${context.filePath}
Extension: ${context.fileExtension}
Line: ${issue.line}${issue.column !== undefined ? `:${issue.column}` : ''}`);

  // Evidence (problematic code)
  if (issue.evidence) {
    sections.push(`PROBLEMATIC CODE:
\`\`\`${context.fileExtension.substring(1)}
${issue.evidence}
\`\`\``);
  }

  // Surrounding lines (for context)
  if (context.surroundingLines) {
    const { before, issue: issueLine, after } = context.surroundingLines;

    sections.push(`SURROUNDING CODE (for context):
\`\`\`${context.fileExtension.substring(1)}
${before.map(line => `  ${line}`).join('\n')}
→ ${issueLine}  ← ISSUE LINE
${after.map(line => `  ${line}`).join('\n')}
\`\`\``);
  }

  // Related issues (if any)
  if (context.relatedIssues && context.relatedIssues.length > 0) {
    const relatedSummary = context.relatedIssues
      .map(i => `- Line ${i.line}: ${i.message}`)
      .join('\n');

    sections.push(`RELATED ISSUES IN FILE:
${relatedSummary}`);
  }

  return sections.join('\n\n');
}

/**
 * Build output format section
 *
 * WHY: Structured output is easier to parse
 * HOW: Specify exact format with examples
 *
 * @returns Output format instructions
 */
function buildOutputFormat(): string {
  return `OUTPUT FORMAT:
Provide your fix in this exact format:

SEARCH:
\`\`\`
[exact code to find and replace]
\`\`\`

REPLACE:
\`\`\`
[replacement code]
\`\`\`

EXPLANATION:
[One sentence explaining why this fixes the issue]

CONFIDENCE:
[0.0-1.0 score indicating confidence this fix is correct]

IMPORTANT:
- SEARCH block must match existing code exactly (including whitespace)
- REPLACE block should maintain formatting style
- If you cannot provide a fix, explain why in EXPLANATION
- Confidence should be 0.0 if no fix possible`;
}

/**
 * Extract surrounding lines from file content
 *
 * WHY: LLM needs context around the issue line
 * HOW: Extract N lines before/after issue line
 *
 * @param fileContent - Full file content
 * @param issueLine - Line number (1-indexed)
 * @param contextLines - Number of lines to include (default: 3)
 * @returns Surrounding lines object
 *
 * EXAMPLE:
 * ```typescript
 * const surrounding = extractSurroundingLines(content, 10, 3);
 * // surrounding = {
 * //   before: ['line 7', 'line 8', 'line 9'],
 * //   issue: 'line 10',
 * //   after: ['line 11', 'line 12', 'line 13']
 * // }
 * ```
 */
export function extractSurroundingLines(
  fileContent: string,
  issueLine: number,
  contextLines: number = 3
): { before: string[]; issue: string; after: string[] } | null {
  const lines = fileContent.split('\n');

  // Validate line number
  if (issueLine < 1 || issueLine > lines.length) {
    return null;
  }

  // Convert to 0-indexed
  const lineIndex = issueLine - 1;

  // Extract surrounding lines
  const beforeStart = Math.max(0, lineIndex - contextLines);
  const afterEnd = Math.min(lines.length, lineIndex + contextLines + 1);

  return {
    before: lines.slice(beforeStart, lineIndex),
    issue: lines[lineIndex] || '',
    after: lines.slice(lineIndex + 1, afterEnd),
  };
}

/**
 * Build quick prompt for simple fixes
 *
 * WHY: Some issues have obvious fixes (e.g., fake package names)
 * HOW: Simpler prompt for faster responses
 *
 * @param issue - Issue
 * @param context - Context
 * @returns Quick prompt
 *
 * USE CASES:
 * - Fake package corrections (stripe-pro → stripe)
 * - Console statement removal
 * - Simple type fixes
 */
export function buildQuickPrompt(issue: Issue, context: LLMContext): string {
  return `Fix this code issue:

FILE: ${context.filePath}
ISSUE: ${issue.message}
${issue.suggestion ? `HINT: ${issue.suggestion}` : ''}

CODE:
\`\`\`${context.fileExtension.substring(1)}
${issue.evidence || ''}
\`\`\`

Provide ONLY the fixed code (no explanation):`;
}

/**
 * Parse confidence from LLM response
 *
 * WHY: Need to extract confidence score for validation
 * HOW: Look for "CONFIDENCE:" section or numeric values
 *
 * @param response - LLM response
 * @returns Confidence score (0-1) or default
 */
export function parseConfidence(response: string): number {
  // Look for CONFIDENCE: section
  const confidenceMatch = response.match(/CONFIDENCE:\s*([\d.]+)/i);
  if (confidenceMatch && confidenceMatch[1]) {
    const confidence = parseFloat(confidenceMatch[1]);
    if (!isNaN(confidence) && confidence >= 0 && confidence <= 1) {
      return confidence;
    }
  }

  // Look for percentage
  const percentMatch = response.match(/(\d+)%\s*confident/i);
  if (percentMatch && percentMatch[1]) {
    const percent = parseInt(percentMatch[1], 10);
    if (!isNaN(percent) && percent >= 0 && percent <= 100) {
      return percent / 100;
    }
  }

  // Default confidence
  return 0.7;
}
