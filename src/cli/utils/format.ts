/**
 * FILE PURPOSE: Terminal output formatting utilities
 *
 * CONTEXT: Format detector results for human-readable terminal display.
 * Uses colors, icons, and structured layout for clarity.
 *
 * DEPENDENCIES:
 * - chalk: Terminal colors
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import chalk from 'chalk';
import type { Issue, DetectorResult } from '../../detectors/types.js';

/**
 * Format a single issue for display
 *
 * WHY: Consistent, readable issue formatting
 * HOW: File:line → Message → Suggestion → Evidence
 *
 * @param issue - Issue to format
 * @returns Formatted string with colors and structure
 *
 * OUTPUT FORMAT:
 * ```
 *   src/foo.ts:42
 *   Package 'stripe-pro' does not exist in npm registry
 *   💡 Did you mean 'stripe'?
 *   📝 import { Stripe } from 'stripe-pro';
 * ```
 */
export function formatIssue(issue: Issue): string {
  const lines: string[] = [];

  // Line 1: File location
  const location = issue.column !== undefined
    ? `${issue.filePath}:${issue.line}:${issue.column}`
    : `${issue.filePath}:${issue.line}`;

  lines.push(chalk.dim(`  ${location}`));

  // Line 2: Message
  const messageColor = issue.severity === 'critical' ? chalk.red :
                      issue.severity === 'high' ? chalk.yellow :
                      issue.severity === 'medium' ? chalk.blue :
                      chalk.dim;

  lines.push(`  ${messageColor(issue.message)}`);

  // Line 3: Suggestion (if present)
  if (issue.suggestion) {
    lines.push(`  ${chalk.green('💡')} ${chalk.dim(issue.suggestion)}`);
  }

  // Line 4: Evidence (if present)
  if (issue.evidence) {
    const evidencePreview = issue.evidence.length > 80
      ? issue.evidence.substring(0, 77) + '...'
      : issue.evidence;
    lines.push(`  ${chalk.dim('📝')} ${chalk.dim(evidencePreview)}`);
  }

  // Line 5: Auto-fix indicator (if present)
  if (issue.fix && issue.fix.confidence !== undefined) {
    const confidencePercent = Math.round(issue.fix.confidence * 100);
    lines.push(`  ${chalk.cyan('🔧')} ${chalk.dim(`Auto-fix available (${confidencePercent}% confidence)`)}`);
  }

  return lines.join('\n');
}

/**
 * Format detector results summary
 *
 * WHY: Show high-level overview before detailed issues
 * HOW: Table-like format with detector stats
 *
 * @param results - Detector results array
 * @returns Formatted summary string
 *
 * OUTPUT FORMAT:
 * ```
 * Detector Results:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * hallucination   ✅  10 files   2 issues   245ms
 * code-quality    ✅  10 files   5 issues   156ms
 * ```
 */
export function formatResults(results: DetectorResult[]): string {
  const lines: string[] = [];

  lines.push(chalk.bold('Detector Results:'));
  lines.push(chalk.dim('━'.repeat(50)));

  for (const result of results) {
    const status = result.success ? chalk.green('✅') : chalk.red('❌');
    const name = result.detectorName.padEnd(15);
    const files = `${result.metadata.filesAnalyzed} files`.padEnd(10);
    const issues = `${result.issues.length} issues`.padEnd(10);
    const time = `${result.metadata.executionTimeMs}ms`;

    lines.push(`${name} ${status}  ${chalk.dim(files)}  ${chalk.dim(issues)}  ${chalk.dim(time)}`);

    if (!result.success && result.error) {
      lines.push(chalk.red(`  Error: ${result.error}`));
    }
  }

  return lines.join('\n');
}

/**
 * Format issue count by severity
 *
 * WHY: Quick overview of issue distribution
 * HOW: Count by severity, format with colors
 *
 * @param issues - Issues array
 * @returns Formatted count string
 *
 * EXAMPLE:
 * ```typescript
 * formatIssueCounts(issues)
 * // "3 critical, 5 high, 2 medium, 1 low"
 * ```
 */
export function formatIssueCounts(issues: Issue[]): string {
  const counts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  const parts: string[] = [];

  if (counts.critical > 0) {
    parts.push(chalk.red(`${counts.critical} critical`));
  }
  if (counts.high > 0) {
    parts.push(chalk.yellow(`${counts.high} high`));
  }
  if (counts.medium > 0) {
    parts.push(chalk.blue(`${counts.medium} medium`));
  }
  if (counts.low > 0) {
    parts.push(chalk.dim(`${counts.low} low`));
  }

  return parts.length > 0 ? parts.join(', ') : chalk.green('0 issues');
}

/**
 * Format file path for display
 *
 * WHY: Shorten paths for readability
 * HOW: Show relative path from cwd
 *
 * @param path - File path
 * @returns Shortened path
 *
 * EXAMPLE:
 * ```typescript
 * formatFilePath('/Users/foo/project/src/bar.ts')
 * // "src/bar.ts" (if cwd is /Users/foo/project)
 * ```
 */
export function formatFilePath(path: string): string {
  const cwd = process.cwd();
  if (path.startsWith(cwd)) {
    return path.substring(cwd.length + 1);
  }
  return path;
}

/**
 * Format execution time
 *
 * WHY: Human-readable time display
 * HOW: Choose appropriate unit (ms, s)
 *
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 *
 * EXAMPLE:
 * ```typescript
 * formatTime(245)   // "245ms"
 * formatTime(2450)  // "2.45s"
 * formatTime(125000) // "2m 5s"
 * ```
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Create progress bar string
 *
 * WHY: Visual progress indicator
 * HOW: ASCII bar with percentage
 *
 * @param current - Current value
 * @param total - Total value
 * @param width - Bar width in characters (default: 20)
 * @returns Progress bar string
 *
 * EXAMPLE:
 * ```typescript
 * progressBar(7, 10)
 * // "████████████░░░░░░░░ 70%"
 * ```
 */
export function progressBar(current: number, total: number, width: number = 20): string {
  const percent = total > 0 ? current / total : 0;
  const filled = Math.round(percent * width);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentText = `${Math.round(percent * 100)}%`;

  return `${bar} ${percentText}`;
}

/**
 * Format JSON output for CI/CD
 *
 * WHY: Machine-readable output for automation
 * HOW: Structured JSON with all relevant data
 *
 * @param results - Detector results
 * @param files - Files analyzed
 * @param executionTimeMs - Time taken
 * @returns JSON string
 */
export function formatJSON(
  results: DetectorResult[],
  files: number,
  executionTimeMs: number
): string {
  const allIssues = results.flatMap(r => r.issues);

  const output = {
    success: allIssues.length === 0,
    filesAnalyzed: files,
    detectorsRun: results.length,
    executionTimeMs,
    issues: allIssues,
    issueCounts: {
      critical: allIssues.filter(i => i.severity === 'critical').length,
      high: allIssues.filter(i => i.severity === 'high').length,
      medium: allIssues.filter(i => i.severity === 'medium').length,
      low: allIssues.filter(i => i.severity === 'low').length,
    },
    detectors: results.map(r => ({
      name: r.detectorName,
      success: r.success,
      issues: r.issues.length,
      executionTimeMs: r.metadata.executionTimeMs,
      error: r.error,
    })),
  };

  return JSON.stringify(output, null, 2);
}
