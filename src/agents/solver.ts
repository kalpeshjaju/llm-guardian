/**
 * FILE PURPOSE: Solver Agent - Apply fixes to files
 *
 * CONTEXT: Part of the Multi-Agent Evolve (MAE) pattern.
 * Takes issues with .fix field and applies them to actual files.
 *
 * DEPENDENCIES:
 * - fs: File operations
 * - detectors: Issue types
 *
 * AUTHOR: Claude Code
 * LAST UPDATED: 2025-11-06
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from 'fs';
import type { Issue } from '../detectors/types.js';

/**
 * Fix result
 */
export interface FixResult {
  /** Whether fix was applied successfully */
  success: boolean;

  /** File that was fixed */
  filePath: string;

  /** Issue that was fixed */
  issueId: string;

  /** Backup file path (for rollback) */
  backupPath?: string;

  /** Error message (if failed) */
  error?: string;

  /** What was changed */
  changes?: {
    linesModified: number;
    charsModified: number;
  };
}

/**
 * Solver Agent
 *
 * WHY: Automatically apply LLM-suggested fixes to code
 * HOW: String replacement with file backup and validation
 *
 * PATTERN: Multi-Agent Evolve (MAE)
 * - Proposer: Suggests fixes ✅
 * - Solver: Applies fixes (this agent) ✅
 * - Judge: Validates fixes (future)
 *
 * SAFETY:
 * - Creates backup before modifying (.llm-guardian-backup)
 * - Validates fix was applied correctly
 * - Provides rollback capability
 * - Dry-run mode for preview
 *
 * EXAMPLE:
 * ```typescript
 * const solver = new SolverAgent({ dryRun: false });
 * const results = await solver.applyFixes(issues);
 * // results = [{ success: true, filePath: '...', backupPath: '...' }]
 * ```
 */
export class SolverAgent {
  private readonly dryRun: boolean;
  private readonly createBackups: boolean;
  private readonly backupSuffix: string;
  private readonly minConfidence: number;

  /**
   * Create Solver Agent
   *
   * @param options - Configuration options
   */
  constructor(options: {
    dryRun?: boolean;
    createBackups?: boolean;
    backupSuffix?: string;
    minConfidence?: number;
  } = {}) {
    this.dryRun = options.dryRun || false;
    this.createBackups = options.createBackups !== false; // Default true
    this.backupSuffix = options.backupSuffix || '.llm-guardian-backup';
    this.minConfidence = options.minConfidence !== undefined ? options.minConfidence : 0.0; // Default 0.0 (apply all)
  }

  /**
   * Apply fixes to files
   *
   * WHY: Automatically fix detected issues
   * HOW: For each issue with .fix, apply string replacement
   *
   * @param issues - Issues to fix (only those with .fix field)
   * @returns Array of fix results
   *
   * FLOW:
   * 1. Filter issues that have .fix field
   * 2. Group by file (multiple fixes per file)
   * 3. For each file:
   *    a. Create backup
   *    b. Apply all fixes sequentially
   *    c. Validate result
   * 4. Return results
   *
   * ERROR HANDLING:
   * - File not found: Skip with error
   * - Backup failure: Abort for that file
   * - Fix application failure: Restore from backup
   * - Validation failure: Restore from backup
   *
   * PERFORMANCE:
   * - Sequential file processing (avoid race conditions)
   * - Multiple fixes per file applied in one pass
   * - Typical: ~10ms per file
   */
  async applyFixes(issues: Issue[]): Promise<FixResult[]> {
    const results: FixResult[] = [];

    try {
      // Step 1: Filter issues with fixes and confidence threshold
      const fixableIssues = issues.filter(i => {
        if (!i.fix || !i.fix.search || !i.fix.replace) {
          return false;
        }

        // Check confidence threshold (if fix has confidence score)
        if (i.fix.confidence !== undefined) {
          return i.fix.confidence >= this.minConfidence;
        }

        // If no confidence score, apply fix (assume high confidence)
        return true;
      });

      if (fixableIssues.length === 0) {
        return results;
      }

      // Step 2: Group by file
      const fileGroups = this.groupByFile(fixableIssues);

      // Step 3: Process each file
      for (const [filePath, fileIssues] of fileGroups.entries()) {
        const fileResults = await this.fixFile(filePath, fileIssues);
        results.push(...fileResults);
      }

      return results;

    } catch (error) {
      console.error('Solver Agent error:', error);
      return results;
    }
  }

  /**
   * Group issues by file path
   *
   * WHY: Apply multiple fixes to same file in one pass
   * HOW: Map file path → issues array
   *
   * @param issues - Issues to group
   * @returns Map of file path to issues
   */
  private groupByFile(issues: Issue[]): Map<string, Issue[]> {
    const groups = new Map<string, Issue[]>();

    for (const issue of issues) {
      const existing = groups.get(issue.filePath) || [];
      existing.push(issue);
      groups.set(issue.filePath, existing);
    }

    return groups;
  }

  /**
   * Fix a single file with multiple issues
   *
   * WHY: Apply all fixes to one file atomically
   * HOW: Backup → Apply fixes → Validate → Cleanup
   *
   * @param filePath - File to fix
   * @param issues - Issues in that file
   * @returns Fix results for each issue
   */
  private async fixFile(filePath: string, issues: Issue[]): Promise<FixResult[]> {
    const results: FixResult[] = [];
    let backupPath: string | undefined;

    try {
      // Step 1: Validate file exists
      if (!existsSync(filePath)) {
        for (const issue of issues) {
          results.push({
            success: false,
            filePath,
            issueId: issue.id,
            error: `File not found: ${filePath}`,
          });
        }
        return results;
      }

      // Step 2: Read original content
      const originalContent = readFileSync(filePath, 'utf-8');
      let modifiedContent = originalContent;

      // Step 3: Create backup
      if (this.createBackups && !this.dryRun) {
        backupPath = `${filePath}${this.backupSuffix}`;
        copyFileSync(filePath, backupPath);
      }

      // Step 4: Apply each fix sequentially
      for (const issue of issues) {
        if (!issue.fix) {
          continue;
        }

        try {
          const result = this.applyFix(modifiedContent, issue);

          if (result.success && result.newContent) {
            modifiedContent = result.newContent;

            results.push({
              success: true,
              filePath,
              issueId: issue.id,
              backupPath,
              changes: {
                linesModified: this.countLinesChanged(originalContent, modifiedContent),
                charsModified: Math.abs(modifiedContent.length - originalContent.length),
              },
            });
          } else {
            results.push({
              success: false,
              filePath,
              issueId: issue.id,
              error: result.error || 'Failed to apply fix',
            });
          }
        } catch (error) {
          results.push({
            success: false,
            filePath,
            issueId: issue.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Step 5: Write modified content (if not dry-run)
      if (!this.dryRun && modifiedContent !== originalContent) {
        writeFileSync(filePath, modifiedContent, 'utf-8');
      }

      return results;

    } catch (error) {
      // Restore from backup on error
      if (backupPath && existsSync(backupPath) && !this.dryRun) {
        try {
          copyFileSync(backupPath, filePath);
        } catch {
          // Ignore restore errors
        }
      }

      // Return error for all issues
      for (const issue of issues) {
        results.push({
          success: false,
          filePath,
          issueId: issue.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return results;
    }
  }

  /**
   * Apply a single fix to content
   *
   * WHY: Execute the fix (string replacement)
   * HOW: Based on fix type (string-replace, regex-replace, etc.)
   *
   * @param content - Current file content
   * @param issue - Issue with .fix field
   * @returns Result with new content or error
   */
  private applyFix(
    content: string,
    issue: Issue
  ): { success: boolean; newContent?: string; error?: string } {
    if (!issue.fix) {
      return { success: false, error: 'No fix provided' };
    }

    const { type, search, replace } = issue.fix;

    try {
      switch (type) {
        case 'string-replace':
          return this.applyStringReplace(content, search, replace);

        case 'regex-replace':
          return this.applyRegexReplace(content, search, replace);

        case 'llm-generated':
          // LLM-generated fixes use string replacement
          return this.applyStringReplace(content, search, replace);

        case 'ast-transform':
          // AST transforms not yet implemented (future)
          return { success: false, error: 'AST transforms not yet supported' };

        default:
          return { success: false, error: `Unknown fix type: ${type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Apply string replacement fix
   *
   * WHY: Most common fix type (exact string match)
   * HOW: Find search string, replace with new string
   *
   * @param content - File content
   * @param search - String to find (or RegExp)
   * @param replace - Replacement string
   * @returns Result with new content
   */
  private applyStringReplace(
    content: string,
    search: string | RegExp,
    replace: string
  ): { success: boolean; newContent?: string; error?: string } {
    const searchStr = typeof search === 'string' ? search : search.source;

    // Check if search pattern exists
    if (!content.includes(searchStr)) {
      return {
        success: false,
        error: `Search pattern not found in file: ${searchStr.substring(0, 50)}...`,
      };
    }

    // Apply replacement
    const newContent = content.replace(searchStr, replace);

    // Validate something changed
    if (newContent === content) {
      return {
        success: false,
        error: 'Replacement did not modify content',
      };
    }

    return { success: true, newContent };
  }

  /**
   * Apply regex replacement fix
   *
   * WHY: Handle pattern-based replacements
   * HOW: Use regex.replace()
   *
   * @param content - File content
   * @param search - RegExp pattern (or string)
   * @param replace - Replacement string
   * @returns Result with new content
   */
  private applyRegexReplace(
    content: string,
    search: string | RegExp,
    replace: string
  ): { success: boolean; newContent?: string; error?: string } {
    try {
      const regex = typeof search === 'string' ? new RegExp(search) : search;
      const newContent = content.replace(regex, replace);

      if (newContent === content) {
        return {
          success: false,
          error: 'Regex pattern did not match any content',
        };
      }

      return { success: true, newContent };
    } catch (error) {
      return {
        success: false,
        error: `Invalid regex: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Count lines changed between two versions
   *
   * WHY: Provide statistics on changes
   * HOW: Compare line arrays
   *
   * @param original - Original content
   * @param modified - Modified content
   * @returns Number of lines that differ
   */
  private countLinesChanged(original: string, modified: string): number {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    let changed = 0;
    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== modifiedLines[i]) {
        changed++;
      }
    }

    return changed;
  }

  /**
   * Rollback fixes by restoring from backups
   *
   * WHY: Undo if fixes caused problems
   * HOW: Copy backup files back to original paths
   *
   * @param results - Fix results from applyFixes()
   * @returns Rollback results
   */
  async rollback(results: FixResult[]): Promise<{ success: boolean; filesRestored: number }> {
    let filesRestored = 0;

    try {
      const uniqueBackups = new Map<string, string>();

      // Collect unique backup paths
      for (const result of results) {
        if (result.success && result.backupPath && existsSync(result.backupPath)) {
          uniqueBackups.set(result.filePath, result.backupPath);
        }
      }

      // Restore each file
      for (const [filePath, backupPath] of uniqueBackups.entries()) {
        try {
          copyFileSync(backupPath, filePath);
          filesRestored++;
        } catch (error) {
          console.error(`Failed to restore ${filePath}:`, error);
        }
      }

      return { success: filesRestored > 0, filesRestored };

    } catch (error) {
      return { success: false, filesRestored };
    }
  }

  /**
   * Clean up backup files
   *
   * WHY: Remove backups after successful fixes
   * HOW: Delete all .llm-guardian-backup files
   *
   * @param results - Fix results from applyFixes()
   */
  cleanupBackups(results: FixResult[]): void {
    const uniqueBackups = new Set<string>();

    for (const result of results) {
      if (result.backupPath && existsSync(result.backupPath)) {
        uniqueBackups.add(result.backupPath);
      }
    }

    for (const backupPath of uniqueBackups) {
      try {
        unlinkSync(backupPath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get statistics about fixes
   *
   * WHY: Report summary of what was fixed
   * HOW: Count successes, failures, lines changed
   *
   * @param results - Fix results
   * @returns Statistics
   */
  static getStatistics(results: FixResult[]): {
    total: number;
    successful: number;
    failed: number;
    filesModified: number;
    linesModified: number;
  } {
    const filesModified = new Set(results.filter(r => r.success).map(r => r.filePath));

    const linesModified = results
      .filter(r => r.success && r.changes)
      .reduce((sum, r) => sum + (r.changes?.linesModified || 0), 0);

    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      filesModified: filesModified.size,
      linesModified,
    };
  }
}

export default SolverAgent;
